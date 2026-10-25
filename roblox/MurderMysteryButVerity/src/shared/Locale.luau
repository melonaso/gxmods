--!strict
-- Textos traducibles. El juego está escrito en español (idioma de origen) y
-- todo texto visible pasa por Locale.t(fuente, args):
--   Locale.t("Verity despierta en {seconds}s", { seconds = 12 })
--
-- En el cliente, la fuente se traduce con el Translator del jugador, que
-- combina la tabla incluida en el juego (LocalizationService.GameStrings,
-- generada por tools/extract_strings.py) y la tabla de la nube, que Roblox
-- traduce automáticamente a todos los idiomas (ver README). Los {parámetros}
-- se sustituyen después de traducir, así una sola entrada sirve para
-- cualquier número o nombre.
--
-- En el servidor, Locale.t solo devuelve la fuente: los textos viajan sin
-- traducir (fuente + args) y cada cliente los traduce a su idioma.
--
-- Un argumento que empieza por "@" también se traduce (por ejemplo el nombre
-- de un mapa o de un objeto): { map = "@Mansión" }.

local LocalizationService = game:GetService("LocalizationService")
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")

local Locale = {}

local translator: Translator? = nil
local cache: { [string]: string } = {}
local loading = false

local function fetch()
	local player = Players.LocalPlayer
	local ok, result = pcall(LocalizationService.GetTranslatorForPlayerAsync, LocalizationService, player)
	if not ok then
		ok, result = pcall(LocalizationService.GetTranslatorForLocaleAsync, LocalizationService, player.LocaleId)
	end
	if ok and result then
		translator = result
		table.clear(cache)
	end
end

local function load()
	if loading or translator or not RunService:IsClient() then
		return
	end
	loading = true
	task.spawn(function()
		fetch()
		loading = false
	end)
end

-- Cliente: obtiene el traductor del jugador antes de construir la interfaz
-- (espera como mucho `timeout` segundos; si no llega, se usa el español y se
-- sigue intentando en segundo plano).
function Locale.init(timeout: number?)
	if translator or not RunService:IsClient() then
		return
	end
	loading = true
	local done = false
	task.spawn(function()
		fetch()
		done = true
		loading = false
	end)
	local deadline = os.clock() + (timeout or 3)
	while not done and os.clock() < deadline do
		task.wait()
	end
end

local function translate(source: string): string
	local cached = cache[source]
	if cached then
		return cached
	end
	local text = source
	local current = translator
	if current then
		local ok, result = pcall(current.Translate, current, game, source)
		if ok and typeof(result) == "string" and result ~= "" then
			text = result
		end
		cache[source] = text
	else
		load()
	end
	return text
end

local function substitute(text: string, args: { [string]: any }, translateRefs: boolean): string
	return (string.gsub(text, "{([%w_]+)}", function(name: string): string
		local value = args[name]
		if value == nil then
			return "{" .. name .. "}" -- sin valor: se deja tal cual
		end
		if typeof(value) == "string" and string.sub(value, 1, 1) == "@" then
			local inner = string.sub(value, 2)
			return if translateRefs then translate(inner) else inner
		end
		return tostring(value)
	end))
end

function Locale.t(source: string, args: { [string]: any }?): string
	if not RunService:IsClient() then
		return source
	end
	local text = translate(source)
	return if args then substitute(text, args, true) else text
end

-- Sustituye los parámetros sin traducir (texto de respaldo en español).
function Locale.format(source: string, args: { [string]: any }?): string
	return if args then substitute(source, args, false) else source
end

-- Texto de un TextLabel del mundo (BillboardGui / SurfaceGui creados en el
-- servidor): guarda la fuente y los argumentos en atributos y cada cliente lo
-- muestra traducido (WorldText en WorldFX). Text queda en español de respaldo.
function Locale.setWorldText(label: TextLabel, source: string, args: { [string]: any }?)
	label.AutoLocalize = false
	label:SetAttribute("LocaleSource", source)
	for name, value in args or {} do
		label:SetAttribute("LocaleArg_" .. name, value)
	end
	label.Text = Locale.format(source, args)
	if not label:HasTag("WorldText") then
		label:AddTag("WorldText")
	end
end

-- Lo usa el cliente para pintar un texto de Locale.setWorldText.
function Locale.renderWorldText(label: TextLabel)
	local source = label:GetAttribute("LocaleSource")
	if typeof(source) ~= "string" then
		return
	end
	local args = {}
	for key, value in label:GetAttributes() do
		local name = string.match(key, "^LocaleArg_(.+)$")
		if name then
			args[name] = value
		end
	end
	local text = Locale.t(source, args)
	-- formato opcional alrededor del texto traducido (etiquetas de color...)
	local wrap = label:GetAttribute("LocaleFormat")
	if typeof(wrap) == "string" then
		text = (string.gsub(wrap, "{text}", function()
			return text
		end))
	end
	label.Text = text
end

-- Marca un texto para tools/extract_strings.py sin traducirlo todavía (por
-- ejemplo en tablas que se traducen al mostrarlas).
function Locale.mark(source: string): string
	return source
end

-- Marca un argumento para que el cliente lo traduzca (ver arriba).
function Locale.ref(source: string): string
	return "@" .. source
end

-- Idioma del jugador (para depurar).
function Locale.localeId(): string
	local current = translator
	return if current then current.LocaleId else "es-es"
end

return Locale

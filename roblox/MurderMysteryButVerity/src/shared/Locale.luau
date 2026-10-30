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
--
-- Idioma: por defecto el de la cuenta de Roblox del jugador; en Ajustes se
-- puede elegir otro de Locale.Languages (Locale.setLanguage). Al cambiarlo se
-- dispara Locale.changed y la interfaz se vuelve a dibujar en el nuevo idioma.

local LocalizationService = game:GetService("LocalizationService")
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")

local Locale = {}

-- Idiomas incluidos en la tabla GameStrings (columna -> nombre en su idioma).
-- `locale` es el código que se pide a LocalizationService.
Locale.Languages = {
	{ code = "es", locale = "es-es", name = "Español" },
	{ code = "en", locale = "en-us", name = "English" },
	{ code = "pt", locale = "pt-br", name = "Português" },
	{ code = "fr", locale = "fr-fr", name = "Français" },
	{ code = "de", locale = "de-de", name = "Deutsch" },
	{ code = "it", locale = "it-it", name = "Italiano" },
	{ code = "nl", locale = "nl-nl", name = "Nederlands" },
	{ code = "sv", locale = "sv-se", name = "Svenska" },
	{ code = "pl", locale = "pl-pl", name = "Polski" },
	{ code = "cs", locale = "cs-cz", name = "Čeština" },
	{ code = "ro", locale = "ro-ro", name = "Română" },
	{ code = "tr", locale = "tr-tr", name = "Türkçe" },
	{ code = "ru", locale = "ru-ru", name = "Русский" },
	{ code = "uk", locale = "uk-ua", name = "Українська" },
	{ code = "ar", locale = "ar-001", name = "العربية" },
	{ code = "id", locale = "id-id", name = "Bahasa Indonesia" },
	{ code = "ms", locale = "ms-my", name = "Bahasa Melayu" },
	{ code = "fil", locale = "fil-ph", name = "Filipino" },
	{ code = "vi", locale = "vi-vn", name = "Tiếng Việt" },
	{ code = "th", locale = "th-th", name = "ไทย" },
	{ code = "ja", locale = "ja-jp", name = "日本語" },
	{ code = "ko", locale = "ko-kr", name = "한국어" },
	{ code = "zh-cn", locale = "zh-cn", name = "简体中文" },
	{ code = "zh-tw", locale = "zh-tw", name = "繁體中文" },
}

local translator: Translator? = nil
local cache: { [string]: string } = {}
local loading = false
local chosen: string? = nil -- código elegido en Ajustes (nil = idioma de la cuenta)
local changedEvent = Instance.new("BindableEvent")
Locale.changed = changedEvent.Event

function Locale.findLanguage(code: string?): { code: string, locale: string, name: string }?
	for _, entry in Locale.Languages do
		if entry.code == code then
			return entry
		end
	end
	return nil
end

-- ¿Trae el juego el idioma de este LocaleId ("pt-br" -> "pt")?
local function supported(localeId: string): boolean
	local lower = string.lower(localeId)
	for _, entry in Locale.Languages do
		if lower == entry.code or lower == entry.locale or string.sub(lower, 1, #entry.code + 1) == entry.code .. "-" then
			return true
		end
	end
	return false
end

-- Traductor del idioma de la cuenta; si el juego no trae ese idioma, inglés
-- (mejor que el español de origen para quien no lo habla).
local function accountTranslator(): (boolean, any)
	local player = Players.LocalPlayer
	if not supported(player.LocaleId) then
		return pcall(LocalizationService.GetTranslatorForLocaleAsync, LocalizationService, "en-us")
	end
	local ok, result = pcall(LocalizationService.GetTranslatorForPlayerAsync, LocalizationService, player)
	if not ok then
		ok, result = pcall(LocalizationService.GetTranslatorForLocaleAsync, LocalizationService, player.LocaleId)
	end
	return ok, result
end

local function fetch()
	local ok, result = accountTranslator()
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

-- Cliente: cambia el idioma ("auto" o nil = el de la cuenta de Roblox).
-- Devuelve true si cambió; entonces se dispara Locale.changed.
function Locale.setLanguage(code: string?): boolean
	if not RunService:IsClient() then
		return false
	end
	local entry = Locale.findLanguage(code)
	local ok, result
	if entry then
		ok, result = pcall(LocalizationService.GetTranslatorForLocaleAsync, LocalizationService, entry.locale)
	else
		ok, result = accountTranslator()
	end
	if not (ok and result) then
		return false
	end
	translator = result
	chosen = if entry then entry.code else nil
	table.clear(cache)
	changedEvent:Fire()
	return true
end

-- Idioma elegido en Ajustes ("auto" si se usa el de la cuenta).
function Locale.language(): string
	return chosen or "auto"
end

-- Idioma del jugador (para depurar).
function Locale.localeId(): string
	local current = translator
	return if current then current.LocaleId else "es-es"
end

return Locale

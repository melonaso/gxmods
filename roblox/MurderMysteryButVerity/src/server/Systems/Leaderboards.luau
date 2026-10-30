--!strict
-- Salón de la fama del lobby: dos tablones (atributo Leaderboard = "Wins" o
-- "Coins") con los 10 mejores de todos los tiempos. Cada minuto se suben los
-- valores de los jugadores conectados a un OrderedDataStore y se vuelve a
-- leer el top. Sin DataStore (archivo local sin publicar) se muestran los
-- jugadores del servidor.

local DataStoreService = game:GetService("DataStoreService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Workspace = game:GetService("Workspace")

local Locale = require(ReplicatedStorage.Shared.Locale)
local UI_FONT = Font.new("rbxasset://fonts/families/GothamSSm.json", Enum.FontWeight.Bold)
local PlayerData = require(script.Parent.PlayerData)

local T = Locale.t

local Leaderboards = {}

local INTERVAL = 60
local TOP = 10
local BOARDS = {
	Wins = { store = "SurviveAVerity_Wins_v1", title = T("MÁS VICTORIAS"), field = "wins", color = Color3.fromRGB(255, 200, 60) },
	Coins = { store = "SurviveAVerity_Coins_v1", title = T("MÁS MONEDAS"), field = "coins", color = Color3.fromRGB(255, 220, 120) },
}

type Row = { name: string, value: number }
type Board = { kind: string, rows: { TextLabel }, empty: TextLabel }

local names: { [number]: string } = {}

local function nameOf(userId: number): string
	if names[userId] then
		return names[userId]
	end
	local ok, name = pcall(Players.GetNameFromUserIdAsync, Players, userId)
	names[userId] = if ok and typeof(name) == "string" then name else "?"
	return names[userId]
end

local function valueOf(player: Player, field: string): number
	local data = PlayerData.get(player)
	return if data then math.floor((data :: any)[field] or 0) else 0
end

-- Tablón: título traducible y 10 filas.
local function build(part: BasePart, kind: string): Board
	local info = BOARDS[kind]
	local surface = Instance.new("SurfaceGui")
	surface.Face = Enum.NormalId.Right
	surface.SizingMode = Enum.SurfaceGuiSizingMode.PixelsPerStud
	surface.PixelsPerStud = 40
	surface.LightInfluence = 0.3
	surface.Parent = part
	local title = Instance.new("TextLabel")
	title.BackgroundTransparency = 1
	title.Size = UDim2.fromScale(1, 0.16)
	title.TextScaled = true
	title.FontFace = Font.new("rbxasset://fonts/families/GothamSSm.json", Enum.FontWeight.Heavy)
	title.TextColor3 = info.color
	title.Parent = surface
	Locale.setWorldText(title, info.title)
	local rows = {}
	for i = 1, TOP do
		local row = Instance.new("TextLabel")
		row.AutoLocalize = false
		row.BackgroundTransparency = 1
		row.Position = UDim2.fromScale(0.06, 0.18 + (i - 1) * 0.08)
		row.Size = UDim2.fromScale(0.88, 0.075)
		row.TextScaled = true
		row.TextXAlignment = Enum.TextXAlignment.Left
		row.FontFace = UI_FONT
		row.TextColor3 = if i == 1 then info.color else Color3.fromRGB(235, 230, 240)
		row.Text = ""
		row.Parent = surface
		table.insert(rows, row)
	end
	local empty = Instance.new("TextLabel")
	empty.BackgroundTransparency = 1
	empty.Position = UDim2.fromScale(0.06, 0.45)
	empty.Size = UDim2.fromScale(0.88, 0.1)
	empty.TextScaled = true
	empty.FontFace = UI_FONT
	empty.TextColor3 = Color3.fromRGB(165, 156, 178)
	empty.Visible = false
	empty.Parent = surface
	Locale.setWorldText(empty, T("Todavía no hay nadie"))
	return { kind = kind, rows = rows, empty = empty }
end

local function render(board: Board, rows: { Row })
	for i, label in board.rows do
		local row = rows[i]
		label.Text = if row then `{i}.  {row.name}  —  {row.value}` else ""
	end
	board.empty.Visible = #rows == 0
end

-- Top del servidor (sin DataStore).
local function localTop(field: string): { Row }
	local rows = {}
	for _, player in Players:GetPlayers() do
		if PlayerData.isLoaded(player) then
			table.insert(rows, { name = player.DisplayName, value = valueOf(player, field) })
		end
	end
	table.sort(rows, function(a, b)
		return a.value > b.value
	end)
	while #rows > TOP do
		table.remove(rows)
	end
	return rows
end

local function globalTop(store: OrderedDataStore): { Row }?
	local ok, pages = pcall(store.GetSortedAsync, store, false, TOP)
	if not ok or not pages then
		return nil
	end
	local rows = {}
	for _, entry in (pages :: DataStorePages):GetCurrentPage() do
		local userId = tonumber(entry.key)
		if userId then
			table.insert(rows, { name = nameOf(userId), value = entry.value })
		end
	end
	return rows
end

function Leaderboards.start()
	local lobby = Workspace:WaitForChild("Lobby", 10)
	if not lobby then
		return
	end
	local boards: { Board } = {}
	for _, model in lobby:GetChildren() do
		local kind = model:GetAttribute("Leaderboard")
		local part = model:FindFirstChild("Board")
		if typeof(kind) == "string" and BOARDS[kind] and part and part:IsA("BasePart") then
			table.insert(boards, build(part, kind))
		end
	end
	if #boards == 0 then
		return
	end
	local stores: { [string]: OrderedDataStore } = {}
	while true do
		local online = game.PlaceId ~= 0 and not PlayerData.isMemoryOnly()
		for _, board in boards do
			local info = BOARDS[board.kind]
			local rows: { Row }? = nil
			if online then
				local store = stores[board.kind]
				if not store then
					local ok, result = pcall(DataStoreService.GetOrderedDataStore, DataStoreService, info.store)
					store = if ok then result else nil
					stores[board.kind] = store :: any
				end
				if store then
					for _, player in Players:GetPlayers() do
						if PlayerData.isLoaded(player) and not player:GetAttribute("DataUnsaved") then
							pcall(store.SetAsync, store, tostring(player.UserId), valueOf(player, info.field))
						end
					end
					rows = globalTop(store)
				end
			end
			render(board, rows or localTop(info.field))
		end
		task.wait(if online then INTERVAL else 10)
	end
end

return Leaderboards

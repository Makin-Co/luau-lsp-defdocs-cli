local Library = require("@game/ReplicatedStorage/Library")

local Module = {
	TestValue = false,
}

Module.LoadOnStart = true

type Module = typeof(setmetatable(Module, Module))

function Module.Init() end

function Module.TestMethod(self: Module)
	print(self.TestValue)
end

return Module

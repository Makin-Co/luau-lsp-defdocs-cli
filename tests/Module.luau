local Example = {}

function Example.CreatePlayerID(player: Player, anotherPlayer: Player | boolean): string end

function Example:GenerateDeepPlayer(): boolean end

function Example:KillAllPlayers(exceptions: { string }): { Player } end

return Example

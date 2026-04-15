declare class Example
	function CreatePlayerID(self, player: Player, anotherPlayer: Player | boolean): string end
	function GenerateDeepPlayer(self): boolean end
	function KillAllPlayers(self, exceptions: { string }): { Player } end
end

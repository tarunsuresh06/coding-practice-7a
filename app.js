const express = require("express");
const path = require("path");
const sqlite = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let database = null;

const initializeServerAndDb = async () => {
  try {
    database = await sqlite.open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Started on PORT 3000");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
  }
};

initializeServerAndDb();

const convertPlayerFormat = (responseObject) => {
  return {
    playerId: responseObject.player_id,
    playerName: responseObject.player_name,
  };
};

const convertMatchesFormat = (responseObject) => {
  return {
    matchId: responseObject.match_id,
    match: responseObject.match,
    year: responseObject.year,
  };
};

app.get("/players/", async (req, res) => {
  allPlayersQuery = `
    SELECT * FROM player_details
    ORDER BY player_id;
    `;

  const playersArray = await database.all(allPlayersQuery);

  res.send(
    playersArray.map((player) => {
      return convertPlayerFormat(player);
    })
  );
});

app.get("/players/:playerId/", async (req, res) => {
  const { playerId } = req.params;

  const getPlayerQuery = `
    SELECT *
    FROM player_details
    WHERE player_id = ${playerId};
    `;

  const player = await database.get(getPlayerQuery);

  res.send(convertPlayerFormat(player));
});

app.put("/players/:playerId/", async (req, res) => {
  const { playerId } = req.params;
  const { playerName } = req.body;

  const updatePlayerQuery = `
    UPDATE player_details
    SET 
    player_name = '${playerName}';
    `;

  await database.run(updatePlayerQuery);
  res.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (req, res) => {
  const { matchId } = req.params;

  const getMatchQuery = `
    SELECT *
    FROM match_details
    WHERE match_id = ${matchId};
    `;

  const match = await database.get(getMatchQuery);

  res.send(convertMatchesFormat(match));
});

app.get("/players/:playerId/matches", async (req, res) => {
  const { playerId } = req.params;

  const getPlayerMatchQuery = `
    SELECT *
    FROM player_match_score
    NATURAL JOIN match_details
    WHERE
    player_id = ${playerId};
    `;

  const matchArray = await database.all(getPlayerMatchQuery);

  res.send(matchArray.map((eachmatch) => convertMatchesFormat(eachmatch)));
});

app.get("/matches/:matchId/players", async (req, res) => {
  const { matchId } = req.params;

  const getMatchPlayersQuery = `
	    SELECT
	    player_details.player_id AS playerId,
	    player_details.player_name AS playerName
	    FROM player_match_score NATURAL JOIN player_details
        WHERE match_id = ${matchId};`;

  const playerDetails = await database.all(getMatchPlayersQuery);

  res.send(playerDetails);
});

app.get("/players/:playerId/playerScores", async (req, res) => {
  const { playerId } = req.params;

  const getPlayerScored = `
    SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes FROM 
    player_details INNER JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ${playerId};
    `;

  const playerScores = await database.get(getPlayerScored);

  res.send(playerScores);
});

module.exports = app;

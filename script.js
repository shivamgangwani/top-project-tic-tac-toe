console.log("Script loaded");

const Player = (name, marker) => {
    return {name, marker};
}

const GameBoardSquare = (idx) => {
    let mark = "";
    const setMark = (newMark) => (mark = newMark);
    const getMark = () => mark;
    const isMarked = () => getMark() !== "";


    const getElement = () => document.querySelector(`.board-square[data-index='${idx}']`);
    const createElement = () => {
        let el = document.createElement("div");
        el.classList.add("board-square");
        el.textContent = mark;
        el.setAttribute("data-index", idx);
        if(mark) el.classList.add("filled");
        return el;
    }
    return {
        getMark,
        setMark,
        isMarked,
        createElement, 
        getElement, 
    };
}

const GameBoard = () => {
    const GRID_SIZE = 3;
    const BOARD_EL = document.querySelector("#game div#board");
    let squares = generateBlankBoard();

    function generateBlankBoard() {
        let newSqs = [];
        for(let i=0; i<(GRID_SIZE**2); i++) newSqs.push(GameBoardSquare(i));
        return newSqs;
    }
    function clearBoard () { squares = generateBlankBoard() };
    const getSquares = () => squares;
    const fillSquare = (squareIndex, marker) => squares[squareIndex].setMark(marker);
    const getAvailableMoves = () => {
        const availableMoves = [];
        squares.forEach((sq) => { if(sq.getMark() === "") availableMoves.push(squares.indexOf(sq)) });
        return availableMoves;
    }
    const copyBoard = () => {
        let newBoard = GameBoard();
        for(let i =0; i<squares.length; i++) newBoard.fillSquare(i, squares[i].getMark());
        return newBoard;
    }
    const copyAndMove = (index, marker) => {
        let newBoard = copyBoard();
        newBoard.fillSquare(index, marker);
        return newBoard;
    }
    const isBoardFullyMarked = () => getAvailableMoves().length === 0;
    const checkForWinners = () => { 
        const WINNER_PATTERNS = [
            // Rows
            [0, 1, 2],
            [3, 4, 5],
            [6, 7, 8],
            // Columns
            [0, 3, 6],
            [1, 4, 7],
            [2, 5, 8],
            // Diagonals
            [0, 4, 8],
            [2, 4, 6],
        ];
        let winningMarker = "";
        let winningPattern = [];
        for(let j=0; j < WINNER_PATTERNS.length; j++) {
            let pattern = WINNER_PATTERNS[j];
            let marks = pattern.map((idx) => squares[idx].getMark());
            if((marks.every(mark => mark == marks[0])) && (marks[0] !== "")) {
                winningMarker = marks[0];
                winningPattern = pattern;
            }
        }
        return {winningPattern, winningMarker};
    }

    const gameEndCheck = () => {
        let winner = checkForWinners();
        let winnerFlag = winner.winningMarker !== "";
        let boardExhaustedFlag = isBoardFullyMarked();
        winner.gameOver = winnerFlag || boardExhaustedFlag;
        return winner;
    }

    const render = () => {
        let newBoardChildren = [];
        squares.forEach((sq) => newBoardChildren.push(sq.createElement()));
        BOARD_EL.replaceChildren(...newBoardChildren);
    }

    return {
        getSquares,
        fillSquare,
        render,
        gameEndCheck,
        getAvailableMoves,
        clearBoard,
        copyAndMove
    };
}

const AIMove = () => {
    const SCORES = {win : 10, lose : -10, tie : 0};
    const MARKERS = {AI : "X", PLAYER : "O"};

    const getAIScore = (winningMarker) => (winningMarker === "") ? SCORES.tie : (winningMarker === MARKERS.AI ? SCORES.win : SCORES.lose);
    const minimax = (board, maximizingPlayer) => {
        // Check if game is over - tie or somebody won
        let gameStatus = board.gameEndCheck();
        if(gameStatus.gameOver) return getAIScore(gameStatus.winningMarker);

        // Game is not over, play a move and find its value
        const poi_marker = maximizingPlayer ? MARKERS.AI : MARKERS.PLAYER;
        const maxOrMinFn = maximizingPlayer ? Math.max : Math.min;
        let val = maximizingPlayer ? -Infinity : Infinity;

        board.getAvailableMoves().forEach((move) => {
            let newBoard = board.copyAndMove(move, poi_marker);
            let newVal = minimax(newBoard, !maximizingPlayer);
            val = maxOrMinFn(val, newVal);
        });
        return val;
    }

    // Given a board where the next move is by AI, find the best possible move
    const findBestMove = (board) => {
        let bestVal = -Infinity, bestMove = null;
        board.getAvailableMoves().forEach((move) => {
            let newBoard = board.copyAndMove(move, MARKERS.AI);
            let moveVal = minimax(newBoard, false);
            if(moveVal > bestVal) bestVal = moveVal, bestMove = move;
        });
        return bestMove;
    }
    return {findBestMove};
}

const GameRound = (playersArr, P2_AI = false) => {
    const resultDisplay = document.querySelector("#result");
    const board = GameBoard();
    const players = playersArr ? playersArr : [Player("P1", "O"), Player("P2", "X")];
    let playerInTurn;

    const init = () => {
        playerInTurn = players[0];
        render();
    }

    const nextPlayerInTurn = () => players[(players.indexOf(playerInTurn) + 1) % 2];
    const playMove = (e) => {
        if(P2_AI && playerInTurn == players[1]) return alert("Wait for the AI to play!");

        let tarSqIdx = e.target.getAttribute("data-index");
        board.fillSquare(tarSqIdx, playerInTurn.marker);
        playerInTurn = nextPlayerInTurn();
        render();
        if(playerInTurn === players[1] && P2_AI && !board.gameEndCheck().gameOver) {
            setTimeout(() => {
                    board.fillSquare(AIMove().findBestMove(board), playerInTurn.marker);
                    playerInTurn = nextPlayerInTurn();
                    render();
                },
                500
            );
        }
    }

    const bindEvents = () => {
        board.getSquares().forEach((sq) => {
            if(!sq.isMarked()) sq.getElement().addEventListener('click', playMove);
        });
    }

    const concludeGame = (winnerObj) => {
        let result = document.createElement("h1");
        if(!winnerObj.winningMarker) result.textContent = "Game tied!"
        else {
            let sqs = board.getSquares();
            winnerObj.winningPattern.forEach((idx) => {
                let el = sqs[idx].getElement();
                el.classList.add('winning-square');
            });

            let winningPlayer = players.filter((i) => i.marker == winnerObj.winningMarker)[0];
            result.textContent = `${winningPlayer.name} (${winningPlayer.marker}) won the game!`;
        }
        resultDisplay.replaceChildren(result);
    }

    const render = () => {
        board.render();
        let winner = board.gameEndCheck();
        if(!winner.gameOver) bindEvents();
        else concludeGame(winner);
    }

    const resetRound = () => {
        document.querySelector("#board").replaceChildren();
        resultDisplay.replaceChildren();
    }
    init();

    return {playMove,resetRound}
}

(function Game() {
    const DOM_CACHE = {
        userInput : document.querySelector("#game-info")
    }
    let Players = [];
    let P2_AI = false;
    let CURRENT_ROUND = null;

    const resetPlayers = () => {
        Players = [];
        DOM_CACHE.userInput.querySelector("input#p1-username").value = "";
        DOM_CACHE.userInput.querySelector("input#p2-username").value = "";
    }

    const resetGame = () => {
        resetPlayers();
        if(CURRENT_ROUND) CURRENT_ROUND.resetRound();
        CURRENT_ROUND = null;
        render();
    }

    const updatePlayerInformation = () => {
        // Extract Player Information
        p1UsernameField = DOM_CACHE.userInput.querySelector("input#p1-username");
        p1Username = p1UsernameField.value ? p1UsernameField.value : "Player 1";
        p1UsernameField.value = p1Username;

        P2_AI = DOM_CACHE.userInput.querySelector("input#p2-ai").checked;

        p2UsernameField = DOM_CACHE.userInput.querySelector("input#p2-username");
        p2Username = p2UsernameField.value ? p2UsernameField.value : (P2_AI ? "SkyNet" : "Player 2");
        p2UsernameField.value = p2Username;

        
        Players.push(Player(p1Username, "O"));
        Players.push(Player(p2Username, "X"));
    }

    const startGame = () => {
        if(CURRENT_ROUND) resetGame();
        updatePlayerInformation();
        CURRENT_ROUND = GameRound(Players, P2_AI);
        render();
    };

    const render = () => updateControls();

    const updateControls = () => {
        let GAME_ON = Boolean(CURRENT_ROUND);
        DOM_CACHE.userInput.querySelector("#start-game").disabled = GAME_ON;
        DOM_CACHE.userInput.querySelector("#reset-game").disabled = !GAME_ON;
    }

    function init() {
        DOM_CACHE.userInput.querySelector("#start-game").addEventListener('click', startGame);
        DOM_CACHE.userInput.querySelector("#reset-game").addEventListener('click', resetGame);
    }

    init();
})();
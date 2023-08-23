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
        idx,
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
    let squares = [];
    for(let i=0; i<(GRID_SIZE**2); i++) squares.push(GameBoardSquare(i))

    const getSquares = () => squares;
    const fillSquare = (squareIndex, marker) => squares[squareIndex].setMark(marker);
    const isBoardFullyMarked = () => !squares.map((sq) => (sq.getMark() === "")).includes(true);
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

    const render = () => {
        let newBoardChildren = [];
        squares.forEach((sq) => newBoardChildren.push(sq.createElement()));
        BOARD_EL.replaceChildren(...newBoardChildren);
    }

    return {
        getSquares,
        fillSquare,
        render,
        isBoardFullyMarked,
        checkForWinners
    };
}

const GameRound = () => {
    const board = GameBoard();
    const players = [Player("P1", "O"), Player("P2", "X")];
    let gameOver = false;
    let playerInTurn = players[0];

    const nextPlayerInTurn = () => players[(players.indexOf(playerInTurn) + 1) % 2];
    const playMove = (e) => {
        let tarSqIdx = e.target.getAttribute("data-index");
        board.fillSquare(tarSqIdx, playerInTurn.marker);
        playerInTurn = nextPlayerInTurn();
        render();
    }

    const bindEvents = () => {
        board.getSquares().forEach((sq) => {
            if(!sq.isMarked()) sq.getElement().addEventListener('click', playMove);
        });
    }

    const gameEndCheck = () => {
        let winner = board.checkForWinners();
        let winnerFlag = winner.winningMarker !== "";
        let boardExhaustedFlag = board.isBoardFullyMarked();
        if(!(winnerFlag || boardExhaustedFlag)) gameOver = false;
        else gameOver = true;
        return winner;
    }

    const concludeGame = (winnerObj) => {
        if(!winnerObj.winningMarker) console.log("Game tied");
        else {
            console.log(`Winner: ${winnerObj.winningMarker}`);
            let sqs = board.getSquares();
            winnerObj.winningPattern.forEach((idx) => {
                let el = sqs[idx].getElement();
                el.classList.add('winning-square');
            });
        }
    }

    const render = () => {
        board.render();
        let winner = gameEndCheck();
        if(!gameOver) bindEvents();
        else concludeGame(winner);
    }

    render();
    return {playMove};
}

function sampleGame() {
    const game = GameRound();
}

sampleGame();


/*
    Format of id for <div> chess piece in board:

    #chess-piece-[y-cord]-[x-cord].

    i.e. #chess-piece-0-5

*/

function game_over(color) {
    console.log("GAME OVER");
    console.log(color + " : color");
    return 0;
}

function create_board_spots() {
    //Creates actual board and piece spaces for later use by board.
    $("#chessBoard").empty();
    for (let i = 7; i > -1; i--) {
        $("#chessBoard").append("<div class='c-row' id='chess-row-" + i + "' ></div>");
        for (let j = 0; j < 8; j++) {
            if ((i + j) % 2 == 0) {
                $("#chess-row-" + i).append("<div class='c-piece light-brown-background' id='chess-piece-" + i + "-" + j + "' >&nbsp;</div>");
            }
            else {
                $("#chess-row-" + i).append("<div class='c-piece dark-brown-background' id='chess-piece-" + i + "-" + j + "' >&nbsp;</div>");
            }

        }
    }
}

function write_board(string_board) {
    //Writes pieces in string_board into the html board.
    let b_arr = string_board.split("\n");
    for (let i = 0; i < 8; i++) { b_arr[i] = b_arr[i].split(""); }

    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            if (b_arr[i][j] == " " || b_arr[i][j] == ".") {
              $("#chess-piece-" + i + "-" + j).html("&nbsp;");
            }
            else {
              $("#chess-piece-" + i + "-" + j).html(b_arr[i][j]);
            }
        }
    }
}

function get_board() {
    //Gets pieces in board and returns as string.
    let board = "";
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            board += $("#chess-piece-" + i + "-" + j).text();
        }
        if (i == 7) {
            return board;
        }
        board += "\n";
    }
}




var last_touch = false; //This is the value of piece position that is first clicked on along with value.
var current_touch = false;  //Value of piece that is clicked on next along with value.
var information = {};   //Holds id of Game gotten from element #chessId.



function reverse_move() {
    //Reverses move on board for move saved in last_touch and current_touch
    $("#chess-piece-" + last_touch[0] + "-" + last_touch[1]).html(last_touch[2]);
    $("#chess-piece-" + current_touch[0] + "-" + current_touch[1]).html(current_touch[2]);
}

function on_submit_move() {
    //When submit button is pressed, this function is called.
    //This function sends get request to server.
    //It passes three parameters, "id", "move1", and "move2".
    //"id" is the id of the game and "move1" is the starting position of move and "move2" is ending position of move.
    $.get("/ajax/movePiece?id=" + information["id"] +
          "&move1=" + last_touch[0].toString() + last_touch[1].toString() +
          "&move2=" + current_touch[0].toString() + current_touch[1].toString(),
          function(data) {
              submit_cancel_toggle("off");
              if (!data) {
                  //If the get request returns false or null, then the move is invalid
                  //so the move is reversed and the user is alerted that move is invalid.
                  alert("Invalid Move.");
                  reverse_move();
              }
              else {
                  if (data["finished"]) {
                      game_over(data["finished"]);
                      return;
                  }
              }
              start_game();
          }
     );
}

function on_cancel_move() {
    submit_cancel_toggle("off");
    reverse_move();
    start_game();
}

function click_move(event) {

    //This array holds position of piece clicked on in position 2 for y cordinate and position 3 for x cordinate.
    let id_arr = $(event.currentTarget).attr("id").split("-");

    if (last_touch) {
        $("#chess-piece-" + last_touch[0] + "-" + last_touch[1]).removeClass("highlight-this");
        if (last_touch[0] === id_arr[2] && last_touch[1] === id_arr[3]) {
            last_touch = false;
        }
        else {
            console.log($("#chess-piece-" + last_touch[0] + "-" + last_touch[1]).text());
            current_touch = [id_arr[2], id_arr[3], $(event.currentTarget).html()];
            $("#" + $(event.currentTarget).attr("id")).html($("#chess-piece-" + last_touch[0] + "-" + last_touch[1]).html());
            $("#chess-piece-" + last_touch[0] + "-" + last_touch[1]).html("&nbsp;");
            $(".c-piece").off();
            submit_cancel_toggle("on");
        }
    }
    else {
        $(event.currentTarget).addClass("highlight-this");
        last_touch = [id_arr[2], id_arr[3], $(event.currentTarget).html()];
    }
}

function submit_cancel_toggle(on_off) {
    //This function either adds or removes submitMove button and cancelMove button.
    if (on_off === "on") {
        $(document.body).append("<button id='submitMove'>Submit</button>");
        $(document.body).append("<button id='cancelMove'>Cancel</button>");
        $("#submitMove").one("click", on_submit_move);
        $("#cancelMove").one("click", on_cancel_move);
    }
    else if (on_off === "off") {
        $("#submitMove").remove();
        $("#cancelMove").remove();
    }
}

function start_game() {
    //Resets variables that are used to store move positions,
    //and attachs function to click event on chess pieces inside chessBoard.
    last_touch = false;
    current_touch = false;
    $(".c-piece").on("click", click_move);
}


//Waits till document is ready before starting.
//Operates as main function.
$(document).ready( function() {
    information["id"] = $("#chessId").text();


    //This sends a post request to server getting the board
    //as a string.
    $.ajax({
        type : "POST",
        contentType : "application/json",
        url : "/ajax/getChessById",
        data : JSON.stringify(information),
        dataType : "json",
        timeout : 10000,
        success : function(data) {

            if (data["turn"] < 0) {
                game_over(data["turn"]);
            }
            else {
                //Writes pieces into the board with data returned from post request.
                write_board(data["board"]);
                //Starts game, attaches click events.
                start_game();
            }
        },
        error : function(data) {
            console.log("ERROR Board not found.");
        },
        done : function(e) {
            console.log("FINISHED.");
        }
    });

    //Initilizes the board with html elements, called after
    //ajax, because $.ajax is an asynchronous call, so it works in the background while
    //the board is created so program gets board contents faster.
    //Note: This function does not initilize actual pieces, "write_board(string)" does that.
    create_board_spots();
});

const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

var clientFE = "";

// IP Player Naming
let playerData = {
    "70.12.229.167" : 1,
    "70.12.225.75" : 2,
    "70.12.229.229" : 3,
    "70.12.000.000" : 4, // 할당 예정
}

// FE에서 송신한 게임 종류
let gameInfo = {1:"HRT", 2:"SND", 3:"BTN2", 4:"WGT1", 5:"WGT2", 6:"BTN1"};

//현재 진행중인 게임 정보
let gameIng = 0;

// flag, loop 가 0 이면 게임 종료
let flagQuit=1;
let loopGame=[];
loopGame[0]='0';
loopGame[1]='1';

//game data
let sendData={};
let gameResult={};
let gameResultEach={};
let gameResultAll=[];

//연결상태 FE 송신용
let sendStatus={};
let playerStatus={
  id: 1,
  connection: 1,
}

//연결된 controller 수
let playerIng=0;

// controller game 정상 실행 FE 송신용
let gameStatus={};

// IP 연결상태 내부 관리용
let playerCnnt ={1:0 , 2:0, 3:0, 4:0};

var Gpio = require('onoff').Gpio;
var Relay1 = new Gpio(2, 'out');
var Relay2 = new Gpio(3, 'out');
var Relay3 = new Gpio(4, 'out');
var Relay4 = new Gpio(17, 'out');

var Relays = [Relay1, Relay2, Relay3, Relay4];

let timeoutID;

async function sleep(ms) {
    return new Promise(resolve => {
        timeoutID = setTimeout(resolve, ms);
    });
}

async function controlRelay(ratio) {
    let total = 0;

    for(let i = 0; i < ratio.length; i++) {
	    total += ratio[i];
    }

    for(let i = 0; i < ratio.length; i++) {
        Relays[i].writeSync(1);
        await sleep(Math.ceil((ratio[i] / total) * 10000));
        Relays[i].writeSync(0);
        await sleep(2000);
    }
}

async function motorInit(port) {
	for(let i = 0; i < 4; i++) {
	    if(port[i] == true) {
		    Relays[i].writeSync(1);
	    }
	}

	await sleep(750);

	for(let i = 0; i < 4; i++) {
		Relays[i].writeSync(0);
	}

    return true;
}

async function motorReset(port) {
	for(let i = 0; i < 4; i++) {
	    if(port[i] == true) {
	        Relays[i].writeSynce(1);	
	    }
	}

	await sleep(3000);

	for(let i = 0; i < 4; i++) {
	    Relays[i].writeSync(0);
	}

	return true;
}

async function motorStop() {
	clearTimeout(timeoutID);
	for(let i = 0; i < 4; i++) {
	    Relays[i].writeSync(0);
	}
}
  
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {

    const req = socket.request;
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const ipslice = ip.slice(7);

    //지금 연결된 컨트롤러만 count
    if(playerCnnt[playerData[ipslice]]==0) {
        playerIng+=1; 
        playerCnnt[playerData[ipslice]]=1;
        playerStatus.id = playerData[ipslice];
        playerStatus.connection = 1; // connection
        sendStatus['playerNum']=playerIng;
        sendStatus['playerStatus']=playerStatus;
        console.log(sendStatus)
        console.log("connectionAll", playerCnnt)
        io.to(clientFE).emit('server:playerParticipate', sendStatus);
        // io.to(clientFE).emit('chat message', sendStatus);
    }

    // FE와 연결되면 현재 컨트롤러 연결상태 송신
    socket.on('client:connectServer', (msg) => {
        console.log(msg);
        clientFE = socket.id;
        console.log("clientFE", clientFE)
        for(var i=1; i<=4; i++) {
            if(playerCnnt[i]==0) continue;
            playerStatus.id = i;
            playerStatus.connection = 1; // connection
            sendStatus['playerNum']=playerIng;
            sendStatus['playerStatus']=playerStatus;
            io.to(clientFE).emit('server:playerParticipate', sendStatus);
            // io.to(clientFE).emit('chat message', sendStatus);
        }
    });

    //FE로부터 어떤 게임인지 수신
    socket.on('client:createGame', (msg, callback) => {
        console.log('message: ' + msg);
        //송신할 데이터 초기화
        gameResultEach={};
        gameResultAll=[]; //
        gameResult={};
        flagQuit=1; // loop 변수 활성화/초기화
        playerIng=-1; //turn에 필요한 플레이어 id 초기화
   
        gameIng = msg.gameId;
        //arduino로 게임 전달.
        console.log("gamenum", gameIng)
        console.log("game", gameInfo[gameIng]);
        //게임정보를 controller에게 송신
        io.emit('server:createGame', gameInfo[gameIng]);
        gameStatus['statusCode'] = 0;
        gameStatus['data'] = "";
        console.log("gameStatus:", gameStatus);
        //client로 게임 연결/실행 상태 전송               
        callback(gameStatus)
        //io.to(clientFE).emit('chat message', gameStatus);
      });

    // SND turn제 실행 'client:changeGame'
    socket.on('client:changeGame', (msg) => {
        if(playerIng!=msg.playerId) {
          flagQuit=0;
          // 2턴이상이라면 이전 턴 결과를 송신한다.
          if(playerIng!=-1)
          {
            if(flagQuit==0)
            {
              //결과 데이터를 FE에전송한다.
              sendData={};
              //arduino에서 수신한 값을 FE에 담아 보낸다.
              //Each객체는 id, max값 
              sendData['gameData'] = gameResultEach;
              // flagQuit=0이라면 활성화중인 컨트롤러가 게임을 종료한다.
              io.emit('server:sndLoop', gameInfo[gameIng]+loopGame[flagQuit]);
              io.to(clientFE).emit('server:changeGame', sendData);
            }
          }
          //playerIng=3; //just debugging 
          playerIng=msg.playerId;
          //새로운 플레이어턴 시작 loop 활성화
          flagQuit=1;
          //게임정보와 플레이어 변경정보를 보내준다.
          io.emit('server:createGame', gameInfo[gameIng]+playerIng);
        }     
    });

    //arduino에서 값을 받아온다.
    socket.on('arduino:upload', (msg)=> {
        console.log(msg);
        //sendData FE 실시간 데이터 송신
        gameResult.id = playerData[ipslice];
        gameResult.cnt = msg.count;
        sendData['gameData'] = gameResult;
        console.log("sendData:", sendData);
        io.to(clientFE).emit('server:changeGame', sendData);
        //io.to(clientFE).emit('chat message', sendData);
    });

    //FE에 종료 전까지는 cnt_val 송신
    socket.on('arduino:hrtLoop', (msg)=> {
        console.log(msg);
        sendData={};
        //arduino에서 수신한 값을 FE에 담아 보낸다.
        gameResult.id = playerData[ipslice];
        gameResult.cnt = msg.count;
        //결과 data 수집
        gameResultEach.id = playerData[ipslice];
        gameResultEach.cnt = msg.count;
        gameResultEach.max = msg.max;
        gameResultEach.mean = msg.mean;
        gameResultEach.min = msg.min;
        gameResultEach.gap = msg.gap;
        gameResultAll[gameResultEach.id-1]=gameResultEach;
        //console.log("game data 수집", gameResultAll);
  
        sendData['gameData'] = gameResult;
        if(flagQuit==1)
        {
          console.log("sendData to client ing:", sendData);
          io.to(clientFE).emit('server:changeGame', sendData);
        }
        // flagQuit=0이라면 arduino가 게임을 종료한다.
        io.emit('server:hrtLoop', gameInfo[gameIng]+loopGame[flagQuit]);
    });
  
      socket.on('arduino:sndLoop', (msg)=> {
        console.log(msg);
        gameResult={};
        sendData={};
        //arduino에서 수신한 값을 FE에 담아 보낸다.
        gameResult.id = playerData[ipslice];
        gameResult.cnt = msg.count;
  
        //max 결과값갱신 송신은 client:changeGame turn 종료되면 송신.
        gameResultEach.id = playerData[ipslice];
        gameResultEach.max = msg.max;
  
        sendData['gameData'] = gameResult;
  
        // loop 활성화일때만 값 송신.
        if(flagQuit==1)
        {
          io.to(clientFE).emit('server:changeGame', sendData);
          //loop를 돌려준다. 종료는 client:changeGame에서
          io.emit('server:sndLoop', gameInfo[gameIng]+loopGame[flagQuit]);
        }
    });
  
      //게임 임의 종료
      socket.on('client:destroyGame', (msg, callback) => {
        console.log(msg);
        console.log('a');
        // 필요하다면 데이터 init 추가
        flagQuit=0; //loop 비활성화
        //종료 코드
        gameStatus={};
        io.emit('server:hrtLoop', gameInfo[gameIng]+loopGame[flagQuit]);
        gameStatus['statusCode'] = 0;
        callback(gameStatus);
    });
  
      //게임 정상 종료 client:completeGame
      socket.on('client:completeGame', (msg) => {
        console.log(msg);
        console.log('b');
        flagQuit=0; //loop 비활성화
        sendData={};
        //배열안 빈값 정리
        let sendFiltered = gameResultAll.filter(function (el){
          return el != null;
        });
        console.log("edid후", sendFiltered);
        sendData['gameData']=sendFiltered;
        console.log("End data", sendData);
        
        //게임 결과 전송
        io.to(clientFE).emit('server:completeGame', sendData);
        console.log("game 종료")
        io.emit("server:exitController", "0");
    });

    // 라즈베리파이 Server와 연결이 끊어졌을 경우
    socket.on('disconnect', () => {
        console.log('user disconnected', ipslice);

        //player 연결이 끊어지면 status에 기록하고 값을 FE에 보내준다.
        if(playerCnnt[playerData[ipslice]]==1) {
            //소
            playerStatus.connection=0;
            playerStatus.id = playerData[ipslice];
            playerCnnt[playerData[ipslice]]=0; //내부 관리용
            sendStatus={};
            playerIng-=1; 
            sendStatus['playerNum']=playerIng;//참여중인 player 수
            sendStatus['playerStatus'] = playerStatus; //끊긴 플레이어 정보
            io.to(clientFE).emit('server:playerParticipate', sendStatus);
            //io.to(clientFE).emit('chat message', sendStatus);
            console.log(playerStatus);
            console.log("connectionAll", playerCnnt);
       }
    });

    // 칵테일 제조 비율 및 동작 수신
    socket.on('client:makeCocktail', async (ratio, callback)=> {
      // ex) [1, 3, 0, 0]
        try {
	        console.log("ratio : " + ratio);
	        await controlRelay(ratio);
	        callback({"statusCode": 0});
            }
        catch(error) {
	        callback({"statusCode":-1});
        }

    });

    // 정해진 PORT에 대한 초기화 과정 
    // ( 초기화 : 음료를 호수 끝까지 끌어 올리는 과정)
    socket.on('client:initBeverage', async (port, callback) => {
	    console.log(port);
    	let flag = await motorInit(port);
        if(flag == true) {
            callback({"statusCode" : 0});
        };
    });

    // 정해진 PORT에 대해 호스에서 비워주는 과정
    socket.on('client:clearBeverage', async (port, callback) => {
	    console.log(port);
        let flag = await motorReset(port);
        if(flag == true) {
            callback({"statusCode" : 0});
	    };
    });

    // 술 제조 중 임의적으로 중단시킨 경우
    socket.on('client:forceStopMakingCocktail', (msg) => {
        console.log(msg);
        motorStop();
    });

    // 술을 교체해야하는 경우
    socket.on('client:changeBeverage', (port, callback) => {
        console.log(port);
        callback({"statusCode" : 0});
    });

});

server.listen(3000, () => {
  console.log('listening on *:3000');
});

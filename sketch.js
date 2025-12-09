
ScaleScreen()
let maxWeight = 500;
let offset = 17000;
let currentValue = 17000;
let triggered = false;
let sounds, sound1, sound2, sound3, sound4, sound_end, sound_received;
function setup(){
  sound1 = loadSound("sound/1.wav");
  sound2 = loadSound("sound/2.wav");
  sound3 = loadSound("sound/3.wav");
  sound4 = loadSound("sound/4.wav");
  sound_end = loadSound("sound/end.wav");
  sound_received = loadSound("sound/received.wav");

  sounds = [{
  sound: sound1,
  ratio: 0.60,
  played: false
},{
  sound: sound2,
  ratio: 0.70,
  played: false 
},{
  sound: sound3,
  ratio: 0.80,
  played: false
},{
  sound: sound4,
  ratio: 0.90,
  played: false
}];
}

async function ConnectAbly() {
  const realtimeClient = new Ably.Realtime({
    key: '1aZF6A.gt939A:hrcPYLIfVugcTx7F0uugmetAVV3yM7ZQd2nN6gBlti0',
    clientId: 'my-first-client'
  });
  await realtimeClient.connection.once('connected');
  const channel = realtimeClient.channels.get('scale');
  FigmaElement("#wifi").style.opacity = "1";
  await channel.subscribe((message) => {
    console.log(`Received message: ${message.data}`);
    try {
      triggered = false;
      sounds.forEach((s) => {
        s.played = false;
    });
      result = JSON.parse(message.data);
      FigmaText("#IngredientName", result.ingredient);
      FigmaText("#TotalValue", result.totalValue);
      let totalWidth = 300;
      //TARE the scale
      sound_received.play();
      offset = currentValue;
      FigmaText("#CurrentValue", (currentValue - offset) + "gr");
      maxWeight = result.totalValue;
      //FigmaElement("#Background").setAttribute("fill", "#000000");
    } catch (e) {
      console.error("Error parsing message data:", e);
    }
  });
}
ConnectAbly();

//Add a connection to a web-ble UART device when the screen is pressed.
//This device will send weight data to the program.
connectBLEUART = async function () {
  try {
    await bleUART.connect();
    console.log("Connected to BLE UART device");
    //You can add more code here to handle incoming data from the device
  } catch (error) {
    console.log("Failed to connect to BLE UART device:", error);
  }
}
//When the scale sent an updated value, update the screen
onBLELineReceived(function (line) {
  console.log("Received line from BLE UART:", line);
  let weight = parseFloat(line.replace("Weight: ", ""));
  if (!isNaN(weight)) {
    sounds.forEach((s) => {
      if (!s.played && weight >= offset + s.ratio * maxWeight) {
        s.sound.play();
        s.played = true;
      }
    });
    visibleValue = Math.max(0, Math.floor((weight - offset) / 10) * 10);
    FigmaText("#CurrentValue", visibleValue + "gr");
    let totalWidth = 300;
    currentValue = weight;
    let barWidth = ((visibleValue) / maxWeight) * totalWidth;
    document.querySelector("#MovingBar").setAttribute("width", barWidth + "px");
    if (visibleValue >= maxWeight) {
      console.log("Max weight reached!");
      if (triggered===false){
        triggered = true;
        sound_end.play();
      }
      FigmaElement("#Foreground").style.opacity = "1";
    }else{
      FigmaElement("#Foreground").style.opacity = "0";
    }
  }

});

// Screen to show the scale readings
async function ScaleScreen() {
  //wait unitll the Figma SVG export is loaded
  page = await loadFigma("./FigmaExport/Scale.svg");
  //When tapping on the screen; connect to the BLE UART device
  FigmaButton("#Fullscreen", () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen({ navigationUI: "hide" });
    }
    userStartAudio();
  });
  FigmaElement("#Foreground").style.opacity = "0";
  FigmaElement("#Foreground").style.mixBlendMode = "difference";
  FigmaElement("#Foreground").style.transition = "opacity 0.2s ease-in-out";
  FigmaElement("#wifi").style.opacity = "0.2";
  FigmaButton("#Connect", connectBLEUART);
  FigmaText("#IngredientName", "Flour");
  FigmaText("#CurrentValue", "100gr");
  FigmaText("#TotalValue", "500");
  document.querySelector("#MovingBar").setAttribute("width", "10px");
}

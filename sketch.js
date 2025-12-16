/*
 * SMART KITCHEN SCALE SYSTEM
 * 
 * This program connects a physical scale to a visual interface:
 * 
 * 1. HARDWARE: ESP32 device with load cell (measures weight via Bluetooth)
 * 2. CLOUD: Ably messaging service (sends recipes from phone app)
 * 3. INTERFACE: This js sketch shows progress and plays sounds
 * 
 * FILES:
 * - sketch.js (this file)
 * - FigmaExport/Scale.svg (Figma design exported as SVG) 
 * - - https://www.figma.com/design/OHzbLK9GdSHYtHA1vwMrLi/PCB-design?node-id=1144-57477&t=RoePGWTxYgyBblNR-4
 * - sound/*.wav (sound files played during weighing)
 * FLOW:
 * - Phone app sends ingredient name and target weight via Ably
 * - Scale "tares" (resets to zero) for the new ingredient
 * - As you add ingredient, progress bar fills and sounds play at 60%, 70%, 80%, 90%
 * - Screen inverts when target weight is reached
 */

// Main function that is called to run the app.
ScaleScreen();

// === CONFIGURATION ===
// Maximum weight needed for the current ingredient (in grams)
let maxWeight = 500;
// Reference point to calculate net weight (tare value)
let offset = 17000;
// Current reading from the scale sensor
let currentValue = 17000;
// Prevents playing the "complete" sound multiple times
let triggered = false;

// Sound files that play at different stages of weighing
let sounds, sound_received;

function setup() {
  sound_received = loadSound("sound/received.wav");
  sounds = [
    {
      sound: loadSound("sound/1.wav"),
      ratio: 0.6,
      played: false,
    },
    {
      sound: loadSound("sound/2.wav"),
      ratio: 0.7,
      played: false,
    },
    {
      sound: loadSound("sound/3.wav"),
      ratio: 0.8,
      played: false,
    },
    {
      sound: loadSound("sound/4.wav"),
      ratio: 0.9,
      played: false,
    },
    {
      sound: loadSound("sound/end.wav"),
      ratio: 1.0,
      played: false,
    }
  ];
}

async function ConnectAbly(onConnect, messageCallback) {
  const realtimeClient = new Ably.Realtime({
    key: "1aZF6A.gt939A:hrcPYLIfVugcTx7F0uugmetAVV3yM7ZQd2nN6gBlti0",
    clientId: "my-first-client",
  });
  await realtimeClient.connection.once("connected");
  const channel = realtimeClient.channels.get("scale");
  onConnect();

  await channel.subscribe((message) => {
    console.log(`Received message: ${message.data}`);
    messageCallback(message);
  });
}
function onConnect() {
  FigmaElement("#wifi").style.opacity = "1";
}

/*
When receiving a message from the smartphone. The scale should tare itself and
set the ingredient name and total value.
*/
function messageCallback(message) {
  let result;
  try {
    result = JSON.parse(message.data);
  } catch (e) {
    console.error("Invalid JSON received:", message.data);
    return;
  }
  //Reset the state of all the sounds
  triggered = false;
  sounds.forEach((sound) => {
    sound.played = false;
  });

  FigmaText("#IngredientName", result.ingredient);
  FigmaText("#TotalValue", result.totalValue);
  let totalWidth = 300;
  //TARE the scale
  sound_received.play();
  offset = currentValue;
  FigmaText("#CurrentValue", currentValue - offset + "gr");
  maxWeight = result.totalValue;
  
}
ConnectAbly(onConnect, messageCallback);

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
};
/*
When the load cell (esp32-s3 with ble-uart) gets updated weight data,
this function is called with the new line of data.
*/
onBLELineReceived(function (line) {
  console.log("Received line from BLE UART:", line);
  let weight = parseFloat(line.replace("Weight: ", ""));
  
  //Check if the weight is a valid number
  if (!isNaN(weight)) {

    //Play the sounds at the right moments
    sounds.forEach((sound) => {
      if (!sound.played && weight >= offset + sound.ratio * maxWeight) {
        sound.sound.play();
        sound.played = true;
      }
    });

    //Update the number shown on screen
    visibleValue = Math.max(0, Math.floor((weight - offset) / 10) * 10);
    FigmaText("#CurrentValue", visibleValue + "gr");

    //Update the bar width on the screen
    let totalWidth = 300;
    currentValue = weight;
    let barWidth = (visibleValue / maxWeight) * totalWidth;
    document.querySelector("#MovingBar").setAttribute("width", barWidth + "px");
    
    //Check if the max weight has been reached
    if (visibleValue >= maxWeight) {
      console.log("Max weight reached!");
      FigmaElement("#Foreground").style.opacity = "1";
    } else {
      FigmaElement("#Foreground").style.opacity = "0";
    }
  }
});

// Screen to show the scale readings
async function ScaleScreen() {

  //wait unitll the Figma SVG export is loaded
  page = await loadFigma("./FigmaExport/Scale.svg");

  //Handling the fullscreen button, which also starts audio permission
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
  
  //When pressing the connect button, start the BLE UART connection (to the load cell)
  FigmaButton("#Connect", connectBLEUART);
  FigmaText("#IngredientName", "Flour");
  FigmaText("#CurrentValue", "100gr");
  FigmaText("#TotalValue", "500");
  document.querySelector("#MovingBar").setAttribute("width", "10px");
}

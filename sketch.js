
ScaleScreen()
let maxWeight = 500;
let offset = 17000;
let currentValue = 17000;


async function ConnectAbly() {
  const realtimeClient = new Ably.Realtime({
    key: '1aZF6A.gt939A:hrcPYLIfVugcTx7F0uugmetAVV3yM7ZQd2nN6gBlti0',
    clientId: 'my-first-client'
  });
  await realtimeClient.connection.once('connected');
  const channel = realtimeClient.channels.get('scale');
  FigmaElement("#wifi").setAttribute("visibility", "visible");
  await channel.subscribe((message) => {
    console.log(`Received message: ${message.data}`);
    try {
      result = JSON.parse(message.data);
      FigmaText("#IngredientName", result.ingredient);
      FigmaText("#TotalValue", result.totalValue);
      let totalWidth = 300;
      //TARE the scale
      offset = currentValue;
      FigmaText("#CurrentValue", (currentValue - offset) + "gr");
      maxWeight = result.totalValue;
      FigmaElement("#Background").setAttribute("fill", "#000000");
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
    visibleValue = Math.max(0, Math.floor((weight - offset) / 10) * 10);
    FigmaText("#CurrentValue", visibleValue + "gr");
    let totalWidth = 300;
    currentValue = weight;
    let barWidth = ((visibleValue) / maxWeight) * totalWidth;
    document.querySelector("#MovingBar").setAttribute("width", barWidth + "px");
    if (visibleValue >= maxWeight) {
      FigmaElement("#Background").setAttribute("fill", "#FF0000");
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
  });
  FigmaElement("#wifi").setAttribute("visibility", "hidden");
  FigmaButton("#Connect", connectBLEUART);
  FigmaText("#IngredientName", "Flour");
  FigmaText("#CurrentValue", "100gr");
  FigmaText("#TotalValue", "500");
  document.querySelector("#MovingBar").setAttribute("width", "10px");
}

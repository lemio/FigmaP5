const mqttBroker = "ws://localhost:9001";
const client = mqtt.connect(mqttBroker);

client.on('connect', function () {
  console.log('Connected to MQTT broker');
  client.subscribe("#"); // Subscribe to any channel
});

let image1 = "";
let programStatus = 0;
const typeWriterSpeed = 40;

client.on("message", (topic, message) => {
  topic = topic.toString();
  message = message.toString();
  console.log(topic, message);
  handleMQTTMessage(topic, message);
});

function handleMQTTMessage(topic, message) {
  switch (topic) {
    case "robotStatus":
      handleRobotStatus(message);
      break;
    case "programStatus":
      programStatus = Number(message);
      break;
    case "image":
      image1 = message;
      break;
    case "blocks":
      blocks = message;
      break;
  }
}

function handleRobotStatus(message) {
  const modalElement = select(".Modal");
  if (modalElement != null) {
    if (message === '7') {
      FigmaElement(".Modal").style("display", "none");
    } else {
      FigmaElement(".Modal").style("display", "block").style("opacity", "1");
    }
  }
}

function setup() {
  createCanvas(1, 1);
}

function draw() {}

// NextScreen is a function that will be called when the right arrow is pressed
let NextScreen = IntroScreen;
// PreviousScreen is a function that will be called when the left arrow is pressed
let PreviousScreen = VideoScreen;
// Let's start with the initial screen, which is the video screen
VideoScreen();

let InactivityInterval;
ResetInterval();

function ResetInterval() {
  clearInterval(InactivityInterval);
  InactivityInterval = setInterval(() => {
    // Inactivity timeout
    VideoScreen();
  }, 1000 * 60 * 5);
}

// Add the key bindings
FigmaKey("ArrowRight", () => {
  ResetInterval();
  NextScreen();
});

FigmaKey("ArrowLeft", () => {
  ResetInterval();
  PreviousScreen();
});

// Screen to show a video
function VideoScreen() {
  document.querySelectorAll("video").forEach(x => x.remove());
  document.querySelectorAll("svg").forEach(x => x.remove());
  const video = fullScreenVideo("cobot.mp4");
  NextScreen = () => {
    document.querySelectorAll("video").forEach(x => x.remove());
    document.querySelectorAll("svg").forEach(x => x.remove());
    IntroScreen();
  };
  PreviousScreen = VideoScreen;
}

defaultState = (context = document) => {
  // Hide the next button
  FigmaElement(".Button",context).style("transition", "0s all ease-in-out").style("opacity", "0");
  //Make sure the button will transition when it is shown
  FigmaElement(".Button",context).style("transition", "2s all ease-in-out");
  // Hide the modal
  FigmaElement(".Modal",context).style("display", "none");
}

// Screen to introduce the program
async function IntroScreen() {
  //wait unitll the Figma SVG export is loaded
  page = await loadFigma("./FigmaExport/1-IntroScreen.svg");
  NextScreen = OrganizeScreen;
  PreviousScreen = VideoScreen;
  defaultState(page);
  client.publish("startHome", '1');
  //Wait until the typewriter effect is done
  await FigmaTypeWriter(".Type", typeWriterSpeed, page);
  //Show the button
  FigmaElement(".Button",page).style("opacity", "1").style("transition", "2s all ease-in-out");
}
// Screen to explain that the user needs to organize the objects
async function OrganizeScreen() {
  page = await loadFigma("./FigmaExport/2-OrganizeScreen.svg");
  NextScreen = MarkerScreen;
  PreviousScreen = IntroScreen;
  defaultState(page);
  client.publish("startHome", '1');
  await FigmaTypeWriter(".Type", typeWriterSpeed,page);
  await FigmaTypeWriter(".Type2", typeWriterSpeed,page);
  FigmaElement(".Button",page).style("opacity", "1").style("transition", "2s all ease-in-out");
}

// Screen to explain that the user needs to draw the crosses
async function MarkerScreen() {
  page = await loadFigma("./FigmaExport/3-MarkerScreen.svg");
  NextScreen = ValidateScreen;
  PreviousScreen = OrganizeScreen;
  defaultState();
  await FigmaTypeWriter(".Type", typeWriterSpeed,page);
  FigmaElement(".Button",page).style("opacity", "1").style("transition", "2s all ease-in-out");
}

// Screen to validate the sensed crosses
async function ValidateScreen() {
  await loadFigma("./FigmaExport/4-ValidateScreen.svg");
  defaultState();
  NextScreen = () => {};
  PreviousScreen = MarkerScreen;
  const fillValue = document.querySelector("#output").getAttribute("fill");
  const objectID = "#image" + fillValue.match(/url\(#pattern(.*?)\)/)[1];
  document.querySelector("#output").setAttribute("fill", "white");
  image1 = "";
  client.publish("startCapture", '1');
  document.querySelector(".loadingbar .after").setAttribute("visibility", "hidden");
  // Animate the loading bar while the robot is capturing the image
  await smartAnimate(".loadingbar .before", ".loadingbar .after", 5000, d3.easeInOut);
  /*while (programStatus !== 2) {
    await sleep(10);
    FigmaElement(".Button").style("opacity", "0");
  }
  while (image1 === "") {
    await sleep(10);
    FigmaElement(".Button").style("opacity", "0");
  }*/
  // The robot has captured the image
  FigmaElement(".Button").style("transition", "2s all ease-in-out").style("opacity", "1");
  FigmaElement(".loadingbar").style("opacity", "0");
  FigmaElement(".BorderLoadingBar").style("opacity", "0");
  document.querySelector("#output").setAttribute("fill", fillValue);
  //document.querySelector(objectID).setAttribute("xlink:href", "data:image/png;base64," + image1);
  FigmaElement("#output").style("opacity", "1");
  NextScreen = async () => {
    // The user has validated the image, robot will start moving
    // No next screen, since the robot is moving and the information should stay there
    NextScreen = () => {};
    client.publish("startMovement", '1');
    FigmaElement(".BackButton").style("transition", "0s all ease-in-out").style("opacity", "0");
    FigmaElement(".Button").style("transition", "0s all ease-in-out").style("opacity", "0");
    while (programStatus !== 3) {
      await sleep(10);
      FigmaElement(".Button").style("opacity", "0");
    }
    await sleep(5000);
    FinishedScreen();
  };
}

// Screen to show the finished state
async function FinishedScreen() {
  await loadFigma("./FigmaExport/5-FinishedScreen.svg");
  defaultState();
  NextScreen = VideoScreen;
  PreviousScreen = VideoScreen;
  client.publish("startHome", '1');
  await FigmaTypeWriter(".Type", typeWriterSpeed);
  FigmaElement(".Button").style("opacity", "1").style("transition", "2s all ease-in-out");
}

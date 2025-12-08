
https://github.com/user-attachments/assets/82d07094-fb52-4eee-b374-9ceb6011fdb9

# Figma SVG Importer for p5.js

This project demonstrates how to import SVG files from Figma and use them in a p5.js sketch that runs in VS Code.

Based on https://medium.com/@geert.roumen/from-figma-to-p5-prototyping-interactive-apps-beyond-ux-flows-130a1fdcd4ed

## Getting Started

1. Clone the repository or download the zip file above 
2. Open the project in VS Code
3. Install [p5.vscode by Sam Lavigne](https://marketplace.visualstudio.com/items?itemName=samplavigne.p5-vscode)
4. If it is running it will show Port: 5500 in the bottom right.
5. Open your web browser and navigate to `http://localhost:5050` to see the p5.js sketch in action.

## Elements

All figma elements get passed an ID in SVG, this ID will be seperated into the classes and ID's. For example a Figma element with the name `MainScreen/Button/AddUserButton` will get the class `MainScreen` and `Button`, and the ID `AddUserButton`. By using classes this way multiple Figma elements can share certain behaviour.

## Usage

To use this project, simply replace the files in the FigmaExport folder with your own Figma SVG file. Then, modify the `sketch.js` file to use your SVG file instead of the example file.

```javascript
//An example MainPage
async function MainPage(){
  //Which loads a svg file in a relative folder
  await page = loadFigma("./FigmaExport/MainScreen.svg");
  //Add a Button to this prototype, when the button is pressed/clicked, it will trigger ExplanationPage
  FigmaButton("#mousePress",ExplanationPage)  
}
```

# Function to load a Figma screen

This function loads a Figma screen from the specified file path and executes next code when finished when awaited for.

## Parameters

- `filePath` (string): The file path of the Figma screen to load.

## Example

Not using async await:
```javascript
loadFigma("./FigmaExport/MainScreen.svg").then(() => {
  console.log("MainScreen loaded");
});
```

Using async await:
```javascript
await loadFigma("./FigmaExport/MainScreen.svg");
console.log("MainScreen loaded");
```



## Fonts

To include fonts they need to be added to the style.css file. The font needs to be added to the fonts folder and the style.css file.

## Functions

### loadFigma

Loads an SVG file exported from Figma.

```javascript
function loadFigma(screen)
```

**Example:**

```javascript
loadFigma('path/to/your.svg').then((svgElement) => {
  console.log('SVG loaded:', svgElement);
}).catch((error) => {
  console.error('Error loading SVG:', error);
});
```

### FigmaText

Edits the text of an SVG element.

```javascript
function FigmaText(elementSelector, text, scope = document)
```

**Example:**

```javascript
FigmaText('#elementId', 'New Text');
```

### FigmaElement

Selects an SVG element by its ID.

```javascript
function FigmaElement(elementSelector, scope = document)
```

**Example:**

```javascript
const element = FigmaElement('#elementId');
```

### FigmaButton

Defines a button that triggers a function when pressed.

```javascript
function FigmaButton(elementSelector, response, scope = document, release_response = null)
```

**Example:**

```javascript
FigmaButton('#buttonId', () => {
  console.log('Button clicked');
});
```

### FigmaKey

Handles keyboard events.

```javascript
function FigmaKey(key, response, scope = document, release_response = () => {})
```

**Example:**

```javascript
FigmaKey('Enter', () => {
  console.log('Enter key pressed');
});
```

### FigmaTextField

Makes an element an input field.

```javascript
function FigmaTextField(elementSelector)
```

**Example:**

```javascript
FigmaTextField('#elementId');
```

### FigmaScrollContent

Makes the content of an element scrollable.

```javascript
function FigmaScrollContent(elementSelector, contentId)
```

**Example:**

```javascript
FigmaScrollContent('#containerId', '#contentId');
```

### FigmaRotate

Rotates an element around its center point.

```javascript
function FigmaRotate(elementSelector, rotation = 0, duration = 0, transition_timing_function = 'ease-in-out')
```

**Example:**

```javascript
FigmaRotate('#icon', 180, 2);
```

### FigmaCenter

Centers text elements.

```javascript
function FigmaCenter(ElementSelector)
```

**Example:**

```javascript
FigmaCenter('#textElement');
```

### prepareSmartAnimate

Prepares elements for smart animation.

```javascript
function prepareSmartAnimate(FromElement, ToElement)
```

**Example:**

```javascript
prepareSmartAnimate('#fromElement', '#toElement');
```

### revertAnimation

Reverts the animation of an element.

```javascript
function revertAnimation(FromElement, transitionProperties)
```

**Example:**

```javascript
revertAnimation('#fromElement', 'all 1s ease-in-out');
```

### smartAnimate

Generates a smart animate function to transition styles between elements.

```javascript
function smartAnimate(FromElement, ToElement, transitionProperties)
```

**Example:**

```javascript
smartAnimate('#fromElement', '#toElement', 'all 1s ease-in-out');
```

### FigmaVideo

Handles video elements within SVGs.

```javascript
function FigmaVideo(elementSelector, videoSelector)
```

**Example:**

```javascript
FigmaVideo('#elementId', '#videoId');
```

### FigmaSelectAllContent

Selects all content within an element.

```javascript
function FigmaSelectAllContent(element)
```

**Example:**

```javascript
const element = document.querySelector('#textElement');
FigmaSelectAllContent(element);
```

### FigmaTypeWriter

Creates a typewriter effect for text elements.

```javascript
function FigmaTypeWriter(element, speed, scope = document)
```

**Example:**

```javascript
FigmaTypeWriter('#textElement', 100);
```

### fullScreenVideo

Plays a video in full screen.

```javascript
function fullScreenVideo(fileName, callback)
```

**Example:**

```javascript
fullScreenVideo('path/to/video.mp4', (video) => {
  console.log('Video ended', video);
});
```

<!--
## Open issues/questions

- [ ] Not clear if we are using d3 p5 or native js elements
  `d3 style d3.select(".className").style("fill", "red");`
  `p5 style select(".className").attr("fill", "red");`
  `p5 style select(".className").style("fill", "red");`
  `p5 style select(".className").attribute('fill', '#475731');`
  `native js document.querySelector(".className").style.fill = "red";`
  `native js document.querySelector(".className").setAttribute("fill", "red");`
  `native js document.querySelector(".className").setAttribute("style", "fill:red");`
- [ ] Do we want to use promises or callbacks, and suggest async await?

- [ ] How to handle multiple screens?
`loadFigma("./FigmaExport/MainScreen.svg", (page) => {`

- [ ] How to handle smart animations between screens?
 `loadFigmaAnimation("./FigmaExport/MainScreen.svg", (page) => {`

# Functions

## `FigmaTextField(element, editButton = null,father)`
This function creates a textfield that can be edited by clicking on it. The textfield will be created in the father element. The editButton is optional, if it is not provided the textfield will be editable by clicking on it.

## Triggers

### Element based triggers
- [x] On click (f) `onClick`
- [x] On drag (f) `onDrag`
- [ ] While hovering (f)
- [x] While pressing (f) `onMove`
- [ ] Mouse enter (f)
- [ ] Mouse leave (f)
- [ ] Mouse down (f)
- [ ] Mouse up (f)

### Global features
- [x] Key/Gamepad (f) `FigmaKey`
- [x] After delay (f) `sleep`
- [ ] Draw (p5) 


## Actions:

### Page
- [ ] Navigate to
- [ ] Navigate back 
- [ ] Scroll to
- [ ] Open Link

### Logic
- [ ] Set variable
- [ ] Conditional

### Overlay
- [ ] Open overlay
- [ ] Swap overlay
- [ ] Close overlay
- [ ] Hide overlay

## Hiding components

Best practises:

`document.querySelector(".loadingbar .checked").setAttribute("visibility", "hidden");`
`FigmaElement(".Modal").style("display", "none");`
`FigmaElement(".BorderLoadingBar")?.style("opacity", "0");`
`FigmaElement(".Modal").style("display", "block").style("opacity", "1");`

-->

var xml;
/*
Screen is a relative URL to the desired svg file (Figma export)
Response is the function that will be called when the file is loaded
*/

function loadFigma(screen) {
  return new Promise((resolve, reject) => {
    // Clear all timeouts, which is risky, but in this case, it is fine
    var id = window.setTimeout(function() {}, 0);
    while (id--) {
        window.clearTimeout(id); // will do nothing if no timeout with id is present
    }
    // Remove the old svg
    if (document.querySelector("body svg")) {
      document.querySelectorAll("body svg").forEach((x) => x.remove());
    }

    fetch(screen)
      .then((response) => {
        if (!response.ok) {
          throw new Error("File not found");
        }
        return response.text();
      })
      .then((svgText) => {
        const parser = new DOMParser();
        const xml = parser.parseFromString(svgText.replace("&#3;", ""), "image/svg+xml").documentElement;

        // Set the svg to 100% width and height
        xml.setAttribute("width", "100%");
        xml.setAttribute("height", "100%");

        // Adding non-system, web safe fonts and replacing the fonts in the file with these, Inline non-css font definitions get's ignored by browsers, so needs to be added to CSS.
        const defs = document.createElement("defs");
        defs.innerHTML = `
          <style type="text/css">
            @font-face {
              font-family: "DSEG7Modern-Bold";
              src: url("./fonts/DSEG7Modern-Bold.ttf");
            }
            @font-face {
              font-family: "Inter";
              src: url("./fonts/Inter-VariableFont_slnt,wght.ttf");
            }
            @font-face {
              font-family: "Source Code Pro Italic";
              src: url("./fonts/SourceCodePro-Italic-VariableFont_wght.ttf");
            }
            @font-face {
              font-family: "Source Code Pro";
              src: url("./fonts/SourceCodePro-VariableFont_wght.ttf");
            }
          </style>`;
        // Add the fonts to the svg
        xml.prepend(defs);

        // Check if any of the IDs in the svg are classes, if so, replace them with classes
        xml.querySelectorAll("*").forEach((x) => {
          if (x.id.includes("/")) {
            const list = x.id.split("/");
            x.id = list.pop();
            x.classList.add(...list);
          }
        });

        // Add the svg to the body
        document.body.appendChild(xml);

        // Resolve the promise with the svg element
        resolve(document.querySelector("svg g"));
      })
      .catch((error) => {
        console.error(error);
        reject(error);
      });
  });
}
/*
Function that edits the text of an element
*/
function FigmaText(elementSelector, text, scope = document) {
  if (scope.querySelector(elementSelector + " tspan") != null) {
    scope.querySelector(elementSelector + " tspan").innerHTML = text;
    return scope.querySelector(elementSelector);
  }else{
    console.error("Element with ID #" + elementSelector + " has no tspan, proboably because it is not a Figma text element, check the name including capitalization");
    return null;
  }
}
/*
Simple function to select an element by id
*/
function FigmaElement(elementSelector, scope=document) {
  if (scope.querySelector(elementSelector) != null) {
    return scope.querySelector(elementSelector,scope);
  }else{
    console.error("Element with ID " + elementSelector + " does not exist, check the name including capitalization");
    return null;
  }
}
function is_touch_enabled() {
  return ( 'ontouchstart' in window ) || 
         ( navigator.maxTouchPoints > 0 ) || 
         ( navigator.msMaxTouchPoints > 0 );
}
/*
Defines a button that will call the response function when pressed
*/
function FigmaButton(elementSelector, response,scope = document,release_response = null) {
  
  if (elementSelector instanceof Element) {
    element = elementSelector
  }else{
  if (scope.querySelector(elementSelector) != null) {
    element = scope.querySelector(elementSelector)
  }else{
    console.error("Element with ID #" + elementSelector + " does not exist, check the name including capitalization");
    return false
  }
  if (is_touch_enabled()){
    element.addEventListener("touchstart",response);
    element.addEventListener("touchend",release_response);
    }else{
      element.addEventListener("click",response);
    }
  element.style.cursor = "pointer";
  }
}
function FigmaKey(key, response ,scope = document, release_response = ()=>{}) {
  scope.addEventListener("keydown",(event) => {
    if (event.key == key){
      response(event);
    }
});
scope.addEventListener("keyup",(event) => {
    if (event.key == key){
      release_response(event);
    }
  });
}

/*
Makes the content of the elementSelector scrollable in touch devices and desktop devices
*/
function FigmaScrollContent(elementSelector, contentId) {
  oldY = 0;
  oldScroll = 0;
  document.addEventListener('wheel',(evt) => {
    select("#" + contentId).style("transform","translateY(" + FigmaDimensions(oldScroll + (-evt.deltaY)) + "px)");
    oldScroll += (-evt.deltaY)
  });
  document.querySelector(elementSelector).addEventListener("touchstart",(evt) => {
    oldY = evt.touches[0].pageY
  });

  document.querySelector(elementSelector).addEventListener("touchmove",(evt) => {
    select("#" + contentId).style("transition","all 50ms ease-in-out");
    select("#" + contentId).style("transform","translateY(" + FigmaDimensions(oldScroll + evt.touches[0].pageY-oldY) + "px)");
  })
  document.querySelector(elementSelector).addEventListener("touchend",(evt) => {
    oldScroll += evt.changedTouches[0].pageY-oldY
  });
}
/*
Converts the page coordinates to svg coordinates
*/
function FigmaDimensions(PageDimension){
  var svg = document.querySelector("svg");
  var pt = svg.createSVGPoint();
  pt.x = PageDimension;
  svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
  return svgP.x;
}
function PageDimension(x,y){
  var svg = document.querySelector("svg");
  var pt = svg.createSVGPoint();
  pt.x = x;
  pt.y = y;
  svgP = pt.matrixTransform(svg.getScreenCTM());
  return svgP;
}
/*
Async function to wait for a certain amount of time
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
/*
This function rotates an element around it's centerpoint. 

Add this to the load of the page
FigmaRotate("#icon")

When you want it to rotate with 180 deg in 2 seconds (ease-in-out)
FigmaRotate("#icon",180,2)
*/
function FigmaRotate(elementSelector,rotation = 0, duration = 0, transition_timing_function = 'ease-in-out'){
  /*
  rotate: 287deg;
    transform-box: fill-box;
    transition-duration: 3s;
    transform-origin: center;
*/
  let element = FigmaElement(elementSelector);
  if (element != null) {
    var transition = "transform-box: fill-box;transition-duration:"+ duration + "s;transform-origin:center;transition-timing-function"+transition_timing_function+";";
    element.attribute("style",transition);
    element.style("rotate",rotation + "deg");
    //element.attribute("style",transition+"rotate:" + rotation + "deg;");

  }else{
    console.error("Element with ID " + elementSelector + " does not exist, check the name including capitalization");
  }
}
/*
To make sure text elements are center aligned.
*/
function FigmaCenter(ElementSelector){
  let element = FigmaElement(ElementSelector);
  if (element != null) {
    bbox = element.elt.getBBox();
    selectAll("tspan",element).forEach((element)=>{
      element.attribute("x",Number(bbox.x)+bbox.width/2 ) 
    })
    element.attribute("text-anchor","middle");//text-anchor="middle"
  }else{
    console.error("Element with ID " + ElementSelector + " does not exist, check the name including capitalization");
  }

}


function prepareSmartAnimate(FromElement, ToElement) {
  if (!(FromElement instanceof Element) || !(ToElement instanceof Element)) {
    console.error("Invalid element provided");
    return;
  }
  ToElement.setAttribute("visibility","hidden");
}
/*
Generates a smart animate function in which styles of the FromElement are replaced with the ToElement, with an ease-in-out animation length of 1000ms using the CSS transition functions.
*/

function revertAnimation(FromElement, transitionProperties) {
  if (!(FromElement instanceof Element)) {
    console.error("Invalid element provided");
    return;
  }
  FromElement.setAttribute("style",FromElement.getAttribute("data-old-style"));
  FromElement.style.transition = transitionProperties;
  FromElement.removeAttribute("data-old-style");
  if (FromElement.hasChildNodes()){
    const children = FromElement.children;
    children.forEach(child => {
      revertAnimation(child,transitionProperties);
    })
  }
  FromElement.getBoundingClientRect();
}

function smartAnimate(FromElement, ToElement,transitionProperties) {
  if (!(FromElement instanceof Element) || !(ToElement instanceof Element)) {
    console.error("Invalid element provided");
    return;
  }

  const fromStyles = window.getComputedStyle(FromElement);
  const toStyles = window.getComputedStyle(ToElement);
  console.log(fromStyles);
  // Apply the computed styles to the FromElement

  // Get the style properties to animate
  const properties = Array.from(fromStyles).filter(property => {
    return fromStyles.getPropertyValue(property) !== toStyles.getPropertyValue(property);
  });

  // Apply the initial styles from the FromElement only if this is the first time the animation is triggered
  if (FromElement.getAttribute("data-animated") == null){
    console.log("First time animation");
    properties.forEach(property => {
      FromElement.style[property] = fromStyles.getPropertyValue(property);
      console.log(property,fromStyles.getPropertyValue(property));
    });
  }else{
    console.log("Not first time animation");
  }
  FromElement.setAttribute("data-animated","true");
  FromElement.setAttribute("data-old-style",FromElement.getAttribute("style"));
  // Console log current css
  FromElement.style.transition = transitionProperties;
  //In case you want to move to a static position
  //FromElement.style.transition = `all 10000s ease-in-out -8000s`;
  // Trigger a reflow to ensure the initial styles are applied
  FromElement.getBoundingClientRect();

  // Apply the final styles from the ToElement and animate the transition
  properties.forEach(property => {
    if (property != "visibility" && property != "transition"){
      FromElement.style[property] = toStyles.getPropertyValue(property);
      console.log(property,toStyles.getPropertyValue(property));
    }
    FromElement.style.transition = transitionProperties;
  });

  // Smart animate all children with the same class
  if (FromElement.hasChildNodes()){
    const children = FromElement.children;
    children.forEach(child => {
      console.log(child.className.baseVal);
      ToElement.getElementsByClassName(child.className.baseVal).forEach(x => {
        smartAnimate(child, x,transitionProperties);
      });
      //smartAnimate(child, ToElement.querySelector("." + child.className));
    })
  }
}

//https://stackoverflow.com/questions/58420652/mask-video-svg-shapes
function FigmaVideo(elementSelector, videoSelector) {
  let leftTop = PageDimension(Number(select(elementSelector).attribute("x")),Number(select(elementSelector).attribute("y")));
  let rightBottom = PageDimension(Number(select(elementSelector).attribute("x"))+Number(select(elementSelector).attribute("width")),(Number(select(elementSelector).attribute("y"))+Number(select(elementSelector).attribute("height"))));
  let videoElt = select(videoSelector);
  console.log("lefttop",leftTop,"bottom",rightBottom);
  videoElt.style("position", "absolute");
  videoElt.style("left",leftTop.x + "px");
  videoElt.style("top",leftTop.y + "px");
  videoElt.style("width",(Number(rightBottom.x)-Number(leftTop.x)) + "px");
  videoElt.style("height",(Number(rightBottom.y)-Number(leftTop.y)) + "px");
  //videoElt.style("zIndex",-100);
}

function FigmaSelectAllContent(element){
  //Get the window selections
  let s = window.getSelection()
  //Create a new selection range
  let r = document.createRange()
  //Start the selection at the first letter
  r.setStart(element, 0)
  //Untill the last letter
  r.setEnd(element, element.childElementCount)
  //Remove all existing selections
  s.removeAllRanges()
  //Add the created selection to the screen
  s.addRange(r)
}
//Make an element editable, either by pressing the edit button or pressing on the text itself
function FigmaTextField(element, editButton = null,father){
const defaultContent = element.innerHTML;
element.style.cursor = "text"
if (editButton != null){
  editButton.style.cursor = "pointer"
}


//Check if the content of the element is not deleted (and if so, replace it by the default content)
var observer = new MutationObserver(function(mutations) {
mutations.forEach(function(mutation) {
  if (mutation.type == 'childList') {
      if (element.querySelectorAll("tspan").length == 0) {
          element.innerHTML = defaultContent;
          FigmaSelectAllContent(element)
      }
  }
})
})
var config = { attributes: true, childList: true, characterData: true, subtree: true}
observer.observe(element, config);


//Check if the element is being clicked on or clicked elsewhere

const buffer = 5; //Add a buffer around the text element that counts as a click
document.addEventListener("click",(e) => {
  const rect = element.getBoundingClientRect(); // Get the bounding box
  if (!(e.clientX >= rect.left - buffer && e.clientX <= rect.right + buffer && e.clientY >= rect.top - buffer && e.clientY <= rect.bottom + buffer)) {
      father.contentEditable = false
      element.style.textDecoration = "none"
  }else{
      //Make this element editable this is done after a short timeout, since other element might make the parent non-editable 
      setTimeout(() => {
          father.contentEditable = true
          FigmaSelectAllContent(element)
      }, 1)
      element.style.textDecoration = "underline"
  }
})
if (editButton != null){
  editButton.addEventListener("click",()=>{
      setTimeout(() => {
          father.contentEditable = true
          FigmaSelectAllContent(element)
      }, 10)
      element.style.textDecoration = "underline"
  })
}
document.addEventListener("keydown", (e) =>{
  
  //If key is ENTER or TAB
  switch (e.key){
      case "Enter":
      case "Tab":
          //Make the content non-editable
          father.contentEditable = false;
          element.style.textDecoration = "none"

          //Loose the focus on the element
          let s = window.getSelection()
          s.removeAllRanges()

      break;
  }
})
}

function smartAnimate(FromElement, ToElement,animationDuration = 750, easeType = d3.easeCubicInOut) {
  return new Promise((resolve, reject) => {
    
    if (!(FromElement instanceof Element)){
      FromElement = document.querySelector(FromElement);
    }
    if (!(ToElement instanceof Element)){
      ToElement = document.querySelector(ToElement);
    }
    if (!(FromElement instanceof Element) || !(ToElement instanceof Element)) {
      console.error("Invalid element provided");
      return;
    }
    console.groupCollapsed("smartAnimateD3 from " + FromElement.classList[0] + " to " + ToElement.classList[0]);
    const fromAttributes = FromElement.attributes
    const toAttributes = ToElement.attributes;
    //convert fromAttributes to an object
    
    //console.log("From: ",fromAttributes, "To: ",toAttributes);
    //console.log(fromStyles);
    // Apply the computed styles to the FromElement

    // Get the style properties to animate
    const properties = Array.from(fromAttributes).map(x => x.name).filter(property => {
      if ( fromAttributes[property] != undefined && toAttributes[property] != undefined){
        return fromAttributes[property].value !== toAttributes[property]?.value;
      }//fromAttributes[property]?.value !== toAttributes[property]?.value;
    })
    fromLog = Array.from(fromAttributes).reduce((acc, x) => {
      acc[x.name] = x.value;
      return acc;
    }, {});
    toLog = Array.from(toAttributes).reduce((acc, x) => {
      acc[x.name] = x.value;
      return acc;
    }, {});
    console.table([toLog, fromLog]);



    // Apply the initial styles from the FromElement only if this is the first time the animation is triggered
    if (FromElement.getAttribute("data-animated") == null){
      properties.forEach(property => {
        d3.select(FromElement).attr(property,fromAttributes[property].value);
      });
    }else{
    }
    FromElement.setAttribute("data-animated","true");
    
    // Apply the final styles from the ToElement and animate the transition
    var d3Transition = d3.select(FromElement).transition().duration(animationDuration).ease(easeType);

    properties.forEach(property => {
      if (!["visibility","transition","id","class"].includes(property)){//property != "visibility" && property != "transition"){
        //FromElement.style[property] = toStyles.getPropertyValue(property);
        
        d3Transition.attr(property,toAttributes[property]?.value);
        //console.log(property,toStyles.getPropertyValue(property));
      }
      //FromElement.style.transition = transitionProperties;
    });
    if (FromElement.tagName == "text"){
      var d3TransitionText = d3.select(FromElement.children[0]).transition().duration(animationDuration).ease(easeType);
      d3TransitionText.attr("x",ToElement.children[0].getAttribute("x"));
      d3TransitionText.attr("y",ToElement.children[0].getAttribute("y"));
      if (FromElement.textContent != ToElement.textContent){
        if (FromElement.textContent.includes("%")){
          console.log("Percentage transform")
          from = FromElement.textContent.replace("%","")/100;
          to = ToElement.textContent.replace("%","")/100;
          
          d3TransitionText.textTween(() =>{
            const i = d3.interpolate(from, to);
            return function(t) { return d3.format(".0%")(this.textContent = i(t));
            }
          })
        }else{
          d3TransitionText.text(ToElement.textContent);
        }
      }
        
        //d3TransitionText.text(ToElement.textContent);
        
      }
      //
      d3Transition.on("end", () => {
        resolve();
      });
    // Smart animate all children with the same class
    if (FromElement.hasChildNodes()){
      const children = FromElement.children;
      children.forEach(child => {
        ToElement.getElementsByClassName(child.className.baseVal).forEach(x => {
          smartAnimate(child, x,animationDuration,easeType);
        });
        //smartAnimate(child, ToElement.querySelector("." + child.className));
      })
    }
    console.groupEnd()
  });
}
/*
 function FigmaTypeWriter(element, speed, scope = document) {
  return new Promise((resolve) => {
  if (element instanceof Element){
    elements[0] = element;
  }else{
    elements = document.querySelectorAll(element);
  }
  if (elements[0].children[0].nodeName == "path"){
    resolve = FigmaTypeWriterSVG(element, speed)
  }
  elements.forEach((x) => {
    x.children.sort((a, b) => a.getBoundingClientRect().x - b.getBoundingClientRect().x).sort((a,b) => a.getBoundingClientRect().y - b.getBoundingClientRect().y);
    element.children.forEach((child) => {
      console.log(child)
      child.setAttribute("data-fulltext", child.textContent);
      child.textContent = "";
    })
    i = 0;
    element.children.forEach( (child) => {
      console.log(child)
      Array.from(child.getAttribute("data-fulltext")).forEach( (letter) => {
        console.log(letter)
        
        setTimeout(() => {
          child.textContent += letter;
        }, speed* i);
        i ++;
      })
    })
    setTimeout(() => {
      if (done != null){
        done();
      }
    }, speed* i);
  })
  });
}*/

function FigmaTypeWriter(element, speed, scope = document) {
  return new Promise((resolve) => {
    let i = 0;
    if (!(element instanceof Element)) {
      element = scope.querySelector(element);
    }
    let total = 0;
    element.children.forEach(child => {
      child.setAttribute("fill-opacity", 0);
      total += 1;
    });

    element.children.forEach(child => {
      setTimeout(() => {
        child.setAttribute("fill-opacity", 1);
      }, speed * (total - i));
      i++;
    });

    setTimeout(() => {
      resolve();
    }, speed * total);
  });
}

function fullScreenVideo(fileName, callback){
  //Create a video element
  let video = document.createElement('video');
  video.src = fileName;
  video.style.width = '100vw';
  video.style.height = '100vh';
  video.style.position = 'fixed';
  video.style.top = '0';
  video.style.left = '0';
  video.style.zIndex = '1000';
  video.autoplay = true;
  video.loop = true;
  video.muted = true;
  video.onended = () => {
    callback(video);
  };
  
  //add the video to the DOM:
  document.body.append(video);
  return video;
}
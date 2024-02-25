import sectionResizer from "./section-resizer.js";

// setup the main content as an horizontal section-resizer
const container = document.getElementById("content");
const srMain = sectionResizer(container);
srMain.resize([{ index: 0, size: 200 }]); // make first section initial size 200px

// setup the left container to be a vertical section-resizer
const containerLeft = document.getElementById("content-left");
const srLeft = sectionResizer(containerLeft, { mode: "vertical" });
srLeft.configure({ min: 100 }); // make all sections of left panel minimum size 100px

// ... same for right container
const containerRight = document.getElementById("content-right");
const srRight = sectionResizer(containerRight, { mode: "vertical" });
srRight.configure([{ index: 1, min: 300, max: 300 }]); // configure second section to be fixed

// setup the top right container to be an horizontal section-resizer
const containerRightTop = document.getElementById("right-top");
const srRightTop = sectionResizer(containerRightTop);

// configure + and - buttons to showcase dynamic support of section-resizer
const btnPlus = document.getElementById("add-btn");
btnPlus.addEventListener("click", () => {
  const n = srRightTop.getSections().length;
  if (n < 10) {
    const div = document.createElement("div");
    div.classList.add("child");
    div.textContent = `div #${n + 1}`;
    containerRightTop.appendChild(div);
  }
});
const btnMinus = document.getElementById("rem-btn");
btnMinus.addEventListener("click", () => {
  const elements = srRightTop.getSections();
  if (elements.length > 1) {
    containerRightTop.removeChild(elements[elements.length - 1].element);
  }
});

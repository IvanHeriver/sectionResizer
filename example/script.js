import sectionResizer from "./section-resizer.js";

const container = document.getElementById("content");
const container_left = document.getElementById("content-left");
const container_right = document.getElementById("content-right");
const container_right_top = document.getElementById("right-top");

const minSize = 100;

const srMain = sectionResizer(container, { resizeMode: "right" });

const srLeft = sectionResizer(container_left, { mode: "vertical" });

const srRight = sectionResizer(container_right, { mode: "vertical" });

const srRightTop = sectionResizer(container_right_top);

srMain.resize([{ index: 0, size: 200 }]);
srLeft.configure({ min: 200 });
srRight.configure([{ index: 1, min: 300, max: 300 }]);
srRightTop.configure({ min: minSize });
srMain.configure([
  { index: 1, min: minSize * srRightTop.getSections().length },
]);

console.log(srRightTop.getSections());

const btn = document.getElementById("add-btn");
btn.addEventListener("click", () => {
  console.log(click);
});

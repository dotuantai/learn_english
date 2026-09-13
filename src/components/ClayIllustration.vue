<script setup>
import AppIcon from './AppIcon.vue'
</script>
<template>
  <div class="clay-illustration" aria-hidden="true">
    <div class="orbit orbit-one"></div>
    <div class="orbit orbit-two"></div>
    <span class="clay-ball ball-pink"></span
    ><span class="clay-ball ball-mint"></span
    ><span class="clay-ball ball-tiny"></span>
    <div class="floating-spark"><AppIcon name="sparkles" :size="34" /></div>
    <div class="clay-book">
      <span class="book-spine"></span>
      <div class="book-cover">
        <span class="book-caption">a little every day</span
        ><strong>A<span>+</span></strong
        ><span class="book-line"></span><span class="book-line short"></span
        ><span class="book-heart"><AppIcon name="heart" :size="24" /></span>
      </div>
      <span class="book-pages"></span>
    </div>
    <div class="clay-medkit">
      <div class="medkit-handle"></div>
      <span class="medkit-cross"></span>
    </div>
    <div class="floating-word">
      <span class="word-check"><AppIcon name="check" :size="16" /></span>
      <div><strong>health</strong><small>/helθ/ · sức khỏe</small></div>
    </div>
    <span class="illustration-shadow"></span>
  </div>
</template>
<style scoped>
.clay-illustration {
  position: relative;
  width: 290px;
  height: 290px;
  isolation: isolate;
}
.orbit {
  position: absolute;
  border: 1px solid #ffffff80;
  border-radius: 50%;
  transform: rotate(-24deg);
}
.orbit-one {
  inset: 25px -8px 15px;
}
.orbit-two {
  inset: 51px -35px 42px;
}
.clay-book {
  position: absolute;
  width: 150px;
  height: 190px;
  left: 51px;
  top: 44px;
  transform: rotate(-14deg);
  z-index: 3;
  animation: clay-float 9s ease-in-out infinite;
}
.book-cover {
  position: absolute;
  inset: 0 0 8px;
  overflow: hidden;
  background: linear-gradient(135deg, #b895f0, #8e64d1 67%, #8256c4);
  border-radius: 21px 25px 24px 18px;
  box-shadow:
    12px 17px 22px #79608b38,
    -3px -4px 8px #ffffff60,
    inset 4px 4px 8px #e3caffb3,
    inset -5px -5px 10px #61349650;
  padding: 24px 21px;
  color: #fff;
}
.book-cover strong {
  display: block;
  font: 900 64px/1.2 var(--font-heading);
  letter-spacing: -0.04em;
  text-shadow: 1px 3px 3px #69489b30;
  margin-top: 5px;
}
.book-cover strong span {
  font-size: 39px;
  vertical-align: top;
}
.book-caption {
  font-size: 7px;
  letter-spacing: 0.06em;
  font-weight: 700;
}
.book-line {
  display: block;
  height: 5px;
  width: 66px;
  background: #dfcbfa;
  margin-top: 8px;
  border-radius: 20px;
}
.book-line.short {
  width: 44px;
  margin-top: 6px;
}
.book-heart {
  position: absolute;
  right: 18px;
  bottom: 21px;
  transform: rotate(-9deg);
  color: #f8d1e5;
}
.book-heart svg {
  fill: #f8d1e5;
}
.book-pages {
  position: absolute;
  bottom: 0;
  right: 0;
  left: 5px;
  height: 18px;
  z-index: -1;
  background: repeating-linear-gradient(#fbf5ff 0 3px, #e0d7ea 4px 5px);
  border-radius: 0 0 19px 17px;
  box-shadow: 4px 5px 7px #8b72903d;
}
.book-spine {
  position: absolute;
  top: 11px;
  bottom: 8px;
  left: 10px;
  width: 3px;
  z-index: 4;
  background: #8157bb55;
  border-radius: 50%;
}
.clay-medkit {
  position: absolute;
  right: 9px;
  bottom: 49px;
  width: 99px;
  height: 86px;
  border-radius: 24px;
  background: linear-gradient(135deg, #ffe5ce, #f3bb96);
  transform: rotate(12deg);
  box-shadow:
    7px 11px 16px #94694c30,
    -4px -4px 8px #fff7,
    inset 4px 4px 7px #fff9,
    inset -5px -5px 7px #d5966c50;
  z-index: 4;
}
.medkit-handle {
  position: absolute;
  top: -20px;
  left: 29px;
  width: 43px;
  height: 31px;
  border: 9px solid #f6c6a4;
  border-radius: 15px;
  z-index: -1;
  box-shadow: inset 2px 2px 4px #b8846850;
}
.medkit-cross::before,
.medkit-cross::after {
  content: '';
  position: absolute;
  top: 25px;
  left: 39px;
  width: 20px;
  height: 39px;
  border-radius: 5px;
  background: #fff5e9;
  box-shadow: 2px 3px 4px #cf946b40;
}
.medkit-cross::after {
  transform: rotate(90deg);
  box-shadow: none;
}
.clay-ball {
  position: absolute;
  border-radius: 50%;
  box-shadow:
    inset 3px 4px 7px #ffffffa0,
    inset -5px -6px 8px #00000014,
    5px 8px 14px #8d6f9230;
}
.ball-pink {
  top: 30px;
  right: 26px;
  width: 33px;
  height: 33px;
  background: #f0adc8;
}
.ball-mint {
  bottom: 49px;
  left: 8px;
  width: 23px;
  height: 23px;
  background: #a5d7c5;
}
.ball-tiny {
  top: 18px;
  left: 50px;
  width: 12px;
  height: 12px;
  background: #c7b1e8;
}
.floating-spark {
  position: absolute;
  right: 5px;
  top: 90px;
  color: #b595d3;
  transform: rotate(10deg);
}
.floating-word {
  position: absolute;
  bottom: 17px;
  left: 42px;
  z-index: 6;
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 10px 16px 10px 10px;
  background: linear-gradient(130deg, #fffcff, #f1eaf6);
  border-radius: 18px;
  box-shadow:
    6px 7px 18px #80658c22,
    inset 2px 2px 4px #fff,
    inset -2px -2px 4px #ccbcd830;
  transform: rotate(-5deg);
}
.floating-word strong {
  display: block;
  font: 900 14px var(--font-heading);
}
.floating-word small {
  display: block;
  font-size: 8px;
  margin-top: 1px;
  color: var(--text-muted);
}
.word-check {
  background: #dbf2e5;
  color: #327854;
  border-radius: 50%;
  width: 27px;
  height: 27px;
  display: grid;
  place-items: center;
}
.illustration-shadow {
  position: absolute;
  bottom: 32px;
  left: 45px;
  width: 180px;
  height: 25px;
  border-radius: 50%;
  background: #8f70a52b;
  filter: blur(14px);
}
</style>

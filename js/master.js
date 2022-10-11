$(document).ready(function () {
  $(".cal-container").each(function(){
    ivl= $(this).attr("data-interval")
    spoint= $(this).attr("data-start")
    value= $(this).attr("data-value")
    call(this, spoint, ivl, value)
  })
});

function call(item,number,interval, value=none) {
  let newHtml=`<div class="cal-box old top">+
    <div class="number"></div>
  </div>
  <div class="cal-box old bottom">
        <div class="number"></div>
  </div>
  <div class="cal-box new top">
    <div class="number"></div>
  </div>
  <div class="cal-box new bottom">
        <div class="number"></div>
  </div>`;
  $(item).html(newHtml)


  $(item).children(".cal-container > .old").text(number);
  let num = number - 1;
  $(item).children(".cal-container > .new").text(num);
  console.log($(item).children(".cal-container > .new"))
  setInterval(function () {
    addimpclasses(item, num, number, value);
    num -= 1;
    if (num == -1) {
      num = value;
    }
  }, interval*1000);
}
function addimpclasses(item, num, number) {
  let oldBottom= $(item).children(".cal-container > .old.bottom").eq(0);
  let newBottom= $(item).children(".cal-container > .new.bottom").eq(0);
  let oldTop= $(item).children(".cal-container > .old.top").eq(0);
  let newTop= $(item).children(".cal-container > .new.top").eq(0);
  let oldCard=$(item).children(".cal-container > .old");
  let newCard=$(item).children(".cal-container > .new");


  oldBottom.addClass("anim-old-bottom");
  setTimeout(function () {
    oldTop.addClass("anim-old-top");
    newTop.addClass("anim-new-top");
  }, 400);
  // $(".old").text(num);
  // $(".new").text(num-1);
  setTimeout(function () {
    oldCard.text(num.toString().padStart(2,0));
    if (num == 0) {
      num = parseInt(value);
    }
   newCard.text((num - 1).toString().padStart(2,0));
    oldBottom.removeClass("anim-old-bottom");
    oldTop.removeClass("anim-old-top");
    newTop.removeClass("anim-new-top");
  }, 900);
}

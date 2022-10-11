var targetDate
$(document).ready(function () {
  targetDate=new Date('01 Jan 2022 00:00:00');
  targetDate.setFullYear(new Date().getFullYear()+1);

  console.log(targetDate)
  $(".cal-container").each(function(){
    period= $(this).attr("data-period")
    addCounterCardsHtml(this);
    call(this, period);

  })
});

function addCounterCardsHtml(item){
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
  $(item).html(newHtml);
}

function call(item,period) {

  $(item).children(".cal-container > .old").text(00);
  $(item).children(".cal-container > .new").text(00);
  // console.log($(item).children(".cal-container > .new"))
  setInterval(function () {

    let remainingTime=targetDate-new Date()

    remainingDays=parseInt(remainingTime/86400000);
    remainingTime %=86400000;
    remainingHours=parseInt(remainingTime/3600000);
    remainingTime %=3600000;
    remainingMinutes=parseInt(remainingTime/60000);
    remainingTime %=60000;
    remainingSeconds=parseInt(remainingTime/1000);
    data={"days":remainingDays, "hours":remainingHours, "minutes":remainingMinutes,"seconds":remainingSeconds}
    addimpclasses(item, data[period]);
  }, 1000);
}
function addimpclasses(item,  newNumber) {
  let oldCard=$(item).children(".cal-container > .old");
  let newCard=$(item).children(".cal-container > .new");
  // Do not take any action if this item has not chnaged
  if (newNumber==parseInt($(oldCard[0]).text()))
  {
    return
  }
  let oldBottom= $(item).children(".cal-container > .old.bottom").eq(0);
  let newBottom= $(item).children(".cal-container > .new.bottom").eq(0);
  let oldTop= $(item).children(".cal-container > .old.top").eq(0);
  let newTop= $(item).children(".cal-container > .new.top").eq(0);


  newCard.text((newNumber).toString().padStart(2,0));

  // Play bottom part card animation
  oldBottom.addClass("anim-old-bottom");

  // Play top part card animations after 400s when above animation is complete
  setTimeout(function () {
    oldTop.addClass("anim-old-top");
    newTop.addClass("anim-new-top");
  }, 400);


  // Change old Card and remove animations after 900s when animations are complete
  setTimeout(function () {
    oldCard.text(newNumber.toString().padStart(2,0));
   //  if (num == 0) {
   //    num = parseInt(value);
   //  }
   // newCard.text((num - 1).toString().padStart(2,0));
    oldBottom.removeClass("anim-old-bottom");
    oldTop.removeClass("anim-old-top");
    newTop.removeClass("anim-new-top");
  }, 900);
}

// main variables that used in code
const slideContainer = document.querySelector('.slide__container .wrapper')
const rotateBlock = document.querySelector('.rotate__block');
const agreementButton = document.querySelector('.agree');
const nextSlideButton = document.querySelector('.arrow--next');
const prevSlideButton = document.querySelector('.arrow--prev');

// additional variables for timeout Ids
let slideSolvedActonTimeoutId;

// additional variables for arrows
const hiddenArrowClass = 'hidden';

// additional varibles for slides
const totalSlideAmount = 5;
const pathNames = Array.from(
  { length: totalSlideAmount }, (_, i) => ({ count: i + 1, pathName:`./slides/slide--${i + 1}.html` })
);

// additional function for detecting correct font-size
function heightDetect(percent) {
  const height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

  return (percent * (height - 6)) / 100;
}
function widthDetect(percent) {
  const width = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);

  return (percent * width) / 100;
}
function setResponsiveFontSize() {
  $('.slide__container').css({
    'font-size': `clamp(1px, ${heightDetect(0.925925)}px,${widthDetect(0.520833)}px)`
  });
  $('.arrows').css({
    'font-size': `clamp(1px, ${heightDetect(0.925925)}px,${widthDetect(0.520833)}px)`
  });
}

function setRealVH() {
  let vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}

// Установить изначально
setRealVH();

// Пересчитывать при изменении размеров окна
window.addEventListener('resize', setRealVH);

function isIOS() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

if (isIOS()) {
  $('.slide__content').addClass('ios green');
} else {
  console.log('not')
}

function modalControl() {
  $('.open-modal').on('click', function () {
    $('.slide__modal').fadeIn(500)
  });
  $('.close-modal').on('click', function () {
    $('.slide__modal').fadeOut(500)
  });

  $('.slide__modal-product').on('click', function () {
  const productIndex = Number($(this).data('slide-modal-product'));

  $('.slide__modal').fadeOut(500)
  $('.slide__products').slick('slickGoTo', productIndex - 1);
});
}

// additional function to make request on the last slide
function lastSlideAction() {
  let id = $('#presentation', window.parent.document).attr('data-id');
  let $url = $('#presentation', window.parent.document).attr('data-request-url');
  let href = $('#presentation', window.parent.document).attr('data-href');
  let $token = $('meta[name="csrf-token"]', window.parent.document).attr('content');
  $.ajaxSetup({
    headers: {
      'X-CSRF-TOKEN': $token
    }
  });
  $.ajax({
    type: "POST",
    url: $url,
    data: {"id": id},
    success: function (data) {
      if (data !== false) {
        parent.location.href = href;
      }
    },
    error: function (data) {
      console.log(data);
    }
  });
}

// function that update info about prev/next button
function hideArrows() {
  if ($('.slide').hasClass('slide--product')) {
    console.log('should')
    $(prevSlideButton).removeClass(hiddenArrowClass);
    $(nextSlideButton).removeClass(hiddenArrowClass);
  } else {
    $(nextSlideButton).addClass(hiddenArrowClass);
    $(prevSlideButton).addClass(hiddenArrowClass);
  }
}

// function that detect oriental of device
function updateRotateBlockVisibility() {
  const isPortrait = window.matchMedia('(orientation: portrait)').matches;

  $(rotateBlock).toggleClass('visible', isPortrait);
}

// function that load slide without reloading page
async function loadComponent(componentPathName, slideNum) {
  const response = await fetch(componentPathName);
  const data = await response.text();

  slideContainer.innerHTML = data;
  gsap.from('.slide', { opacity: 0, duration: 1 });
  clearTimeout(slideSolvedActonTimeoutId);
  initSlickSlider();

  if (isIOS()) {
    $('.slide__content').addClass('ios');
  }

  modalControl();
}

//window and document listeners
$(document).ready(function () {
  setResponsiveFontSize();
  updateRotateBlockVisibility();
});
$(window).on('resize', function () {
  setResponsiveFontSize();
  updateRotateBlockVisibility();
});
$(window).on('orientationchange', function () {
  updateRotateBlockVisibility();
});

// function that change slide on the screen
async function changeSlide(direction) {
  const currentSlideNum = slideContainer.getAttribute('data-current-slide');

  let newSlideNum;

  if (direction === 'next') {
    newSlideNum = Number(currentSlideNum) + 1;
  } else if (direction === 'prev') {
    newSlideNum = Number(currentSlideNum) - 1;
  }

  const { pathName } = pathNames.find(pathNameInfo => pathNameInfo.count === +newSlideNum);

  await loadComponent(pathName, newSlideNum);

  slideContainer.setAttribute('data-current-slide', newSlideNum);
  hideArrows();
}

// function that initiate change after slide task was solved
function slideSolvedAction (slideNum) {
  if (slideNum !== 1) {
    $(prevSlideButton).removeClass(hiddenArrowClass);
  }

  if (slideNum < totalSlideAmount) {
    $(nextSlideButton).removeClass(hiddenArrowClass);
  }

  if (slideNum === totalSlideAmount) {
    lastSlideAction();
  }
}

// button listeners
$(agreementButton).on('click', () => {
  loadComponent(pathNames[0].pathName, 1);
  slideContainer.setAttribute('data-current-slide', 1);
  hideArrows();
});
$(nextSlideButton).on('click', () => {
  changeSlide('next')
})
$(prevSlideButton).on('click', () => {
  changeSlide('prev')
});

function initSlickSlider() {
  $('.slide__products').slick({
    infinite: true,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: true,
    dots: true,
  });

  $('.slide__products').on('afterChange', function(event, slick, currentSlide) {
    $('.slide__products-content p.error').removeClass('visible');
  });


  $('.slide--product-buttons button').on('click', function () {
    $('.slide__products-content p.error').removeClass('visible');
      const button = $(this);
      const activeProduct = $('.slide__products .slide__product.slick-active');
      const productImgSrc = activeProduct.find('img').attr('src');
      const productId = activeProduct.data('product-id');
      const needblePart = button.attr('class').split('--')[1];
      const needbleSlot = $(`.slide__slot--${needblePart}`);
      const allowedIds = JSON.parse(needbleSlot.attr('data-correct-products'));

      if (allowedIds.includes(productId)) {
        const newProduct = $('<div>', {
          class: `slide__slot-product slide__slot-product--${productId}`,
          'data-product-id': productId
        }).append( $('<img>', { src: productImgSrc }));
        needbleSlot.append(newProduct);

        const updateAllowedIds = allowedIds.filter(item => item !== productId);

      if (updateAllowedIds.length === 0) {
        needbleSlot.removeClass('half-active')
      }
      needbleSlot.attr('data-correct-products', JSON.stringify(updateAllowedIds));
      } else {
        $('.slide__products-content p.error').addClass('visible');
      }

      if (!$('.slide__slot').hasClass('half-active')) {
        $('.slide__products-content').find('.slick-arrow').fadeOut(300, () => {
          $(prevSlideButton).removeClass(hiddenArrowClass);
          $(nextSlideButton).removeClass(hiddenArrowClass);
        });
      }
  });
}

const backdrop = document.querySelector('.backdrop');
const sideDrawer = document.querySelector('.mobile-nav');
const menuToggle = document.querySelector('#side-menu-toggle');

function backdropClickHandler() {
  backdrop.style.display = 'none';
  sideDrawer.classList.remove('open');
}

function menuToggleClickHandler() {
  backdrop.style.display = 'block';
  sideDrawer.classList.add('open');
}

backdrop.addEventListener('click', backdropClickHandler);
menuToggle.addEventListener('click', menuToggleClickHandler);

document.addEventListener("DOMContentLoaded", function () {
  const activePage = document.querySelector(".pagination .active");

  if (activePage) {
      activePage.scrollIntoView({
          behavior: "smooth",
          inline: "center", // Ensures it scrolls to the center
          block: "nearest"
      });
  }
});


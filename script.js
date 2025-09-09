
document.addEventListener("click", function (e) {
    const circle = document.createElement("div");
    circle.classList.add("click-effect");
    circle.style.left = `${e.pageX}px`;
    circle.style.top = `${e.pageY}px`;

    document.body.appendChild(circle);

    circle.addEventListener("animationend", () => {
        circle.remove();
    });
});

const overlay = document.querySelector(".overlay");
const cover = document.querySelector(".cover");
const reset = document.querySelector(".reset");
const title = document.querySelector(".title");
const container = document.getElementById("container");
const titleC = document.querySelector(".titleC");
const messageC = document.querySelector(".messageC");
const stiker = document.querySelector(".stiker");
const mainStiker = document.querySelector("#main-stiker");
envwrap.style = "transform:scale(0);opacity:0;transition:all .6s ease";
audio = new Audio("" + linkmp3.src);

const envelope = document.getElementById("envelope");
const btnOpen = document.getElementById("open");
//const btnReset = document.getElementById('reset');
reset.style = "transform:scale(0);opacity:0;transition:all .6s ease";

envelope.addEventListener("click", open);
btnOpen.addEventListener("click", open);
//btnReset.addEventListener('click', close);

function open() {
    envelope.classList.remove("close");
    envelope.classList.add("open");
    reset.style = "transform:scale(0);opacity:0;transition:all .6s ease";

    setTimeout(function () {
        envwrap.classList.add("opahidden");
        wallpaper.style = "transform: scale(1.5)";
        setTimeout(function () {
            container.classList.remove("hidden");
            container.classList.add("opamuncul");
            stiker.classList.add("opamuncul");
            wallpaper.style = "transform: scale(1)";
            envwrap.classList.add("hidden");
            katanimasi();
        }, 700);
    }, 1400);
}

document.querySelector(".awalan").onclick = async function () {
    audio.play();

    overlay.style = "opacity:0;transition:all .6s ease";
    cover.style = "transform:scale(0);opacity:0;transition:all .6s ease";
    setTimeout(function () {
        overlay.style.display = "none";
        envwrap.style = "transition:all .6s ease";
        reset.style = "transition:all .6s ease";
        wallpaper.style = "transform: scale(1)";
    }, 300);
};

vjudul = document.querySelector(".titleC").innerHTML;
titleC.innerHTML = "";
vmessage = document.querySelector(".messageC").innerHTML;
messageC.innerHTML = "";
function katanimasi() {
    new TypeIt(".titleC", {
        strings: [vjudul],
        startDelay: 250,
        speed: 27,
        cursor: true,
        afterComplete: function () {
            //clearInterval(scrollInterval);
            titleC.innerHTML = vjudul;
            setTimeout(() => {
                katanimasiAlts();
            }, 300);
        },
    }).go();
}

function katanimasiAlt() {
    new TypeIt(".messageC", {
        strings: [vmessage],
        startDelay: 1,
        speed: 30,
        cursor: true,
        afterComplete: function () {
            clearInterval(scrollInterval);
            messageC.innerHTML = vmessage;
            setTimeout(() => {
                stikerHidden();
                setTimeout(() => {
                    mainStiker.src = stikerAlt1.src;
                }, 300);
            }, 100);
        },
    }).go();
}

function katanimasiAlts() {
  new TypeIt(".messageC", {
    strings: [
      "Selamat hari anniversary kita yang pertama! Udah nggak kerasa kita udah setahun jalanin ini semua—dari seneng, sedih, berantem, sampai adu ego kita yang nggak ada abisnya. Wkwkwk.",
      "<br>Aku nggak nyangka, dari yang awalnya cuma chat-chatan gabut di apk haram, terus jadian, dan akhirnya aku bisa ketemu kamu. Menurut aku itu tantangan kita yang nggak mudah, apalagi ditambah beda agama + LDR. Kurang apa lagi coba?",
      "<br>Pokoknya aku sayang banget sama kamu. Aku mau sama kamu teruus ♥️",
      "<br><b>Terakhir,</b><br>Aku cuma mau kasih tau<br>kalau kamu itu...",
      "<br>Kamu cintaku,<br>Kamu sayangku,<br>Kamu milikku,<br>Kamu duniaku,<br>Kamu semestaku,<br>Kamu rumahku,<br>Kamu segalanya buat akuu 🫶<br><br><i class='fontAlt'>I lovee yoouu Sayaangg</i> 😻💐",
    ],
    startDelay: 1,
    speed: 24,
    cursor: true,
    breakLines: true,
    waitUntilVisible: true,
    afterStep: function (instance) {
      if (instance.is("completed")) {
        setTimeout(function () {
          instance.next();
        }, 400);
      }
    },
    afterComplete: function () {
      document.querySelector(".ti-cursor").style.display = "none";
      setTimeout(function () {
        clearInterval(scrollInterval);
      }, 1000);

      // animasi stiker
      setTimeout(() => {
        stikerHidden();
        setTimeout(() => {
          mainStiker.src = stikerAlt1.src;
        }, 300);
      }, 100);

      // 🚀 munculin popup setelah animasi selesai
      setTimeout(() => {
        showPopup();
      }, 1500);
    },
  }).go();
}


function stikerHidden() {
    stiker.style = "transform:scale(0);opacity:0;";
    setTimeout(function () {
        stiker.style = "transform:scale(1.1);opacity:1;";
    }, 300);
}

function autoScroll() {
    container.scrollTop += 10;
}
const scrollInterval = setInterval(autoScroll, 50);

// Fungsi untuk munculin popup
function showPopup() {
    document.getElementById("popup").style.display = "flex";
}

// Tombol reload (mulai ulang web)
document.getElementById("btnReload").addEventListener("click", () => {
    location.reload();
});

// Tombol game (pindah halaman game.html)
document.getElementById("btnGame").addEventListener("click", () => {
    window.location.href = "/flapybird/index.html"; // ganti sesuai nama file game lo
});

// Tombol game (pindah halaman game.html)
document.getElementById("btnPodcast").addEventListener("click", () => {
    window.location.href = "/pesansuara/index.html"; // ganti sesuai nama file game lo
});


// 🔑 Panggil showPopup() setelah animasi teks selesai
// contoh: di akhir animasi TypeIt atau animasi lo, tambahin:
// showPopup();

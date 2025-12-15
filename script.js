import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBNrV_pjFPSkJJgJENKS521WR0MZQed1co",
  authDomain: "christmas-tree-ffa47.firebaseapp.com",
  databaseURL: "https://christmas-tree-ffa47-default-rtdb.firebaseio.com",
  projectId: "christmas-tree-ffa47",
  storageBucket: "christmas-tree-ffa47.firebasestorage.app",
  messagingSenderId: "887565257758",
  appId: "1:887565257758:web:088b675411967246a5320f",
  measurementId: "G-SN6V7GGV8V"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ==========================================
// 1. 角色数据更新 
// ==========================================
const characters = [
    { 
        id: 'Ghost', 
        name: "Ghost", 
        fullName: "Simon \"Ghost\" Riley", 
        text: "嘿，圣诞快乐！我们已经等了你有一会儿了，别傻站着，快来加入我们吧。", 
        audio: "ghost.mp3"
    },
    { 
        id: 'keegan', 
        name: "Keegan", 
        fullName: "Keegan P. Russ",
        text: "Kid，圣诞快乐！今年你的表现很优秀，希望明年我也能陪伴你的成长。", 
        audio: "keegan.mp3"
    },
     { 
        id: 'Nikto', 
        name: "Nikto", 
        fullName: "Nikto",
        text: "嘿，小兔子，圣诞快乐。我们给你准备了一份圣诞礼物，猜猜是什么？", 
        audio: "nikto.mp3"
    },
     { 
        id: 'krueger', 
        name: "Krueger", 
        fullName: "Sebastian Josef Krueger",
        text: "你跑到哪去了？我有一个很好的节日计划，今天让我们好好庆祝，ok？圣诞快乐。", 
        audio: "krueger.mp3"
    },
     { 
        id: 'Soap', 
        name: "Soap", 
        fullName: "John \"Soap\" MacTavish",
        text: "圣诞快乐，我很开心你来参加今天的庆典。对了，你打算许什么愿望呢？", 
        audio: "soap.mp3"
    },
     { 
        id: 'Price', 
        name: "Price", 
        fullName: "Captain John Price",
        text: "嘿，我们的优秀士兵来了，圣诞快乐!新的一年也请继续支持我们。", 
        audio: "price.mp3"
    },
    { 
        id: 'Riley', 
        name: "Riley", 
        fullName: "Riley",
        text: "汪汪汪！汪汪汪汪汪！汪汪！！~", 
        audio: "riley.mp3"
    },
     { 
        id: 'Hesh', 
        name: "Hesh", 
        fullName: "David \"Hesh\" Walker",
        text: "抓到你了！别太感动，这个位置是专门为你准备的!圣诞快乐!", 
        audio: "Hesh.mp3"
    },
    { 
        id: 'konig', 
        name: "König", 
        fullName: "König",
        text: "哈哈，圣诞快乐。对了，以防你不知道，树顶最高那颗大星星是我挂上去的！", 
        audio: "konig.mp3"
    }
];

// 挂饰类型 (星星、雪花、球)
const ornamentTypes = [
    { icon: 'fa-star', color: '#FFD700' }, // 金色星星
    { icon: 'fa-star', color: '#ffffff' }, // 白色星星
    { icon: 'fa-snowflake', color: '#ffffff' }, // 白色雪花
    { icon: 'fa-circle', color: '#ffffff' }, // 白色球
    { icon: 'fa-circle', color: '#FFD700' }, // 金色球
    { icon: 'fa-circle', color: '#ffb7b2' }  // 浅粉色球
];

const MAX_USER_ORNAMENTS = 35;
let allUserWishes = [];
let occupiedPositions = [];

// --- 预加载 ---
window.addEventListener('load', () => {
    const loader = document.getElementById('loading-screen');
    const startBtn = document.getElementById('start-btn');
    if(loader) {
        loader.style.opacity = '0';
        setTimeout(() => {
            loader.style.display = 'none';
            if(startBtn) {
                startBtn.style.display = 'inline-block';
                setTimeout(() => startBtn.style.opacity = '1', 100);
            }
        }, 500);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    
    // 雪花
    function createSnowflakes() {
        const snowCount = 60;
        for (let i = 0; i < snowCount; i++) {
            const snow = document.createElement('div');
            snow.className = 'snowflake';
            const size = Math.random() * 3 + 2; 
            snow.style.width = `${size}px`; snow.style.height = `${size}px`;
            snow.style.left = `${Math.random() * 100}vw`;
            snow.style.animationDuration = `${Math.random() * 10 + 5}s`;
            snow.style.animationDelay = `${Math.random() * 5}s`;
            document.body.appendChild(snow);
        }
    }
    createSnowflakes();

    

    const overlay = document.getElementById('start-overlay');
    const bgm = document.getElementById('bgm');
    const startBtn = document.getElementById('start-btn');

    if(startBtn) {
        startBtn.addEventListener('click', () => {
            overlay.style.opacity = '0';
            setTimeout(() => overlay.remove(), 800);
            if(bgm) { 
                bgm.volume = 0.3; 
                bgm.play().catch((e) => console.log("需交互播放")); 
            }
            initCharacterBubbles();
            listenToWishes();
        });
    }

    // 初始化泡泡
    function initCharacterBubbles() {
        const container = document.getElementById('character-bubbles-layer');
        characters.forEach((char, index) => {
            const bubble = document.createElement('div');
            bubble.className = 'char-bubble';
            bubble.innerText = char.name; // 泡泡里显示代号
            
            const isLeft = index % 2 === 0;
            const leftPos = isLeft ? (5 + Math.random() * 10) : (75 + Math.random() * 10);
            const topStep = 40 / characters.length; 
            const topPos = 25 + (index * topStep) + (Math.random() * 5); 

            bubble.style.left = `${leftPos}%`;
            bubble.style.top = `${topPos}%`;
            bubble.style.animationDelay = `${index * 0.5}s`;

            bubble.addEventListener('click', () => {
                showCharacterModal(char, bubble);
            });
            container.appendChild(bubble);
        });
    }

    const viewModal = document.getElementById('view-modal');
    const modalText = document.getElementById('modal-text');
    const modalAuthor = document.getElementById('modal-author');
    const charVoice = document.getElementById('char-voice');
    
    function showCharacterModal(char, bubbleElement) {
        // 弹窗显示全名
        modalAuthor.innerText = char.fullName || char.name;
        viewModal.style.display = 'flex';
        
        if(charVoice && char.audio) {
            charVoice.src = char.audio; 
            charVoice.play().catch(()=>{});
        }
        
        // 打字机速度 (200ms)
        typeWriter(modalText, char.text, 200, () => {});

        const closeHandler = () => {
            viewModal.style.display = 'none';
            if(charVoice) charVoice.pause();
            flyStarToTree(bubbleElement, char);
            viewModal.querySelector('.close-btn').removeEventListener('click', closeHandler);
        };
        viewModal.querySelector('.close-btn').addEventListener('click', closeHandler);
    }

    function createOrnament(data, category) {
        const ornament = document.createElement('div');
        const layer = document.getElementById('ornaments-layer');
        const seed = category === 'role' ? stringToSeed(data.id) : data.timestamp;

        let iconHtml = '';
        if (category === 'role') {
            ornament.className = 'ornament role-star';
            iconHtml = '<i class="fas fa-star"></i>';
        } else {
            const typeIndex = Math.floor(seededRandom(seed) * ornamentTypes.length);
            const type = ornamentTypes[typeIndex];
            ornament.className = `ornament user-item user-wrapper`;
            // 应用图标和颜色
            iconHtml = `<i class="fas ${type.icon}" style="color:${type.color}"></i>`;
        }
        ornament.innerHTML = iconHtml;

        let pos = getSafePosition(category === 'role', seed);
        ornament.style.top = `${pos.y}%`;
        ornament.style.left = `${pos.x}%`;
        occupiedPositions.push(pos);

        ornament.addEventListener('click', (e) => {
            e.stopPropagation();
            // 这里用代号即可
            modalAuthor.innerText = category === 'role' ? data.fullName : `✨ ${data.name}`;
            modalText.innerText = data.text;
            viewModal.style.display = 'flex';
            
            const simpleClose = () => {
                viewModal.style.display = 'none';
                viewModal.querySelector('.close-btn').removeEventListener('click', simpleClose);
            };
            viewModal.querySelector('.close-btn').addEventListener('click', simpleClose);
        });

        layer.appendChild(ornament);
    }

    // 核心算法：位置上移 (避开树干)
    function getSafePosition(isRole, seed) {
        let maxAttempts = 30; 
        let safeDistance = 6; 
        
        for (let i = 0; i < maxAttempts; i++) {
            let currentSeed = seed + i * 100; 
            let r1 = seededRandom(currentSeed);
            let r2 = seededRandom(currentSeed + 1);
            
            let y = r1 * 56 + 12; 
            if(isRole) y = r1 * 30 + 12; 

            let spread = (y - 5) * 0.8; 
            if(spread > 90) spread = 90;

            let x = 50 + (r2 - 0.5) * spread;

            let collision = false;
            for (let p of occupiedPositions) {
                let dist = Math.sqrt(Math.pow(p.x - x, 2) + Math.pow(p.y - y, 2));
                if (dist < safeDistance) { collision = true; break; }
            }
            if (!collision) return { x, y };
        }
        
        let finalY = seededRandom(seed+9) * 40 + 20;
        return { x: 50, y: finalY };
    }

    function typeWriter(element, text, speed, callback) {
        let i = 0; 
        if(element) element.innerHTML = "";
        function type() {
            if (i < text.length) {
                if(element) element.innerHTML += text.charAt(i); 
                i++;
                setTimeout(type, speed);
            } else if (callback) callback();
        }
        type();
    }
    
    function flyStarToTree(startElement, charData) {
        const rect = startElement.getBoundingClientRect();
        const flyStar = document.createElement('div');
        flyStar.className = 'flying-star';
        flyStar.innerHTML = '<i class="fas fa-star"></i>';
        flyStar.style.left = rect.left + 'px'; flyStar.style.top = rect.top + 'px';
        document.body.appendChild(flyStar);
        startElement.style.opacity = '0';
        const treeRect = document.querySelector('.tree-wrapper').getBoundingClientRect();
        const targetX = treeRect.left + treeRect.width / 2;
        const targetY = treeRect.top + treeRect.height / 3;
        requestAnimationFrame(() => {
            flyStar.style.transform = `translate(${targetX - rect.left}px, ${targetY - rect.top}px) scale(1.5)`;
            flyStar.style.opacity = '0'; 
        });
        setTimeout(() => {
            flyStar.remove(); startElement.remove(); 
            createOrnament(charData, 'role'); 
        }, 1000);
    }
    
    function seededRandom(seed) { let x = Math.sin(seed) * 10000; return x - Math.floor(x); }
    function stringToSeed(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) { hash = str.charCodeAt(i) + ((hash << 5) - hash); }
        return hash;
    }

    function listenToWishes() {
        const wishesRef = ref(db, 'wishes');
        onValue(wishesRef, (snapshot) => {
            const data = snapshot.val();
            document.querySelectorAll('.user-wrapper').forEach(el => el.remove());
            occupiedPositions = [];
            allUserWishes = [];
            if (data) {
                allUserWishes = Object.values(data);
                const recentWishes = allUserWishes.slice(-MAX_USER_ORNAMENTS);
                recentWishes.forEach(wish => createOrnament(wish, 'user'));
            }
        });
    }
    
    const submitBtn = document.getElementById('submit-wish');
    const writeModal = document.getElementById('write-modal');
    if(submitBtn) {
        submitBtn.onclick = () => {
            const name = document.getElementById('user-name').value.trim();
            const text = document.getElementById('user-wish').value.trim();
            if(name && text) {
                push(ref(db, 'wishes'), { name, text, timestamp: Date.now() })
                    .then(() => {
                        showToast("✨ 心愿已挂上树梢！"); writeModal.style.display = 'none';
                        document.getElementById('user-name').value = ''; document.getElementById('user-wish').value = '';
                    }).catch(err => showToast("失败: " + err.message));
            } else showToast("请完整填写哦~");
        };
    }
    
    function showToast(msg) {
        const toast = document.getElementById('custom-toast'); 
        if(toast) {
            toast.innerText = msg;
            toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 3000);
        }
    }
    
    const addWishBtn = document.getElementById('add-wish-btn');
    if(addWishBtn) addWishBtn.onclick = () => writeModal.style.display = 'flex';
    
    const topStar = document.getElementById('top-star-container');
    if(topStar) {
        topStar.addEventListener('click', () => {
            const list = document.getElementById('wishes-list'); 
            if(list) {
                list.innerHTML = '';
                characters.forEach(c => {
                    const li = document.createElement('li'); li.style.color = "#c0392b";
                    
                    li.innerHTML = `<strong>💝 ${c.name}</strong>: ${c.text}`; list.appendChild(li);
                });
                allUserWishes.forEach(u => {
                    const li = document.createElement('li');
                    li.innerHTML = `<strong>✨ ${u.name}</strong>: ${u.text}`; list.appendChild(li);
                });
                document.getElementById('all-wishes-modal').style.display = 'flex';
            }
        });
    }
    
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.onclick = (e) => {
           e.target.closest('.modal').style.display = 'none';
           if(charVoice) charVoice.pause();
        }
    });
});

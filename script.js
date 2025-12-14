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
// 1. 角色数据更新 (Ghost, Keegan, Konig)
// ==========================================
// 请记得在文件夹里放入对应的 ghost.mp3, keegan.mp3, konig.mp3
const characters = [
    { 
        id: 'ghost', 
        name: "Ghost", 
        text: "Stay frosty. 愿你的圣诞行动像战术一样精准，平安喜乐。", 
        audio: "ghost.mp3", 
        icon: "fa-ghost" // 幽灵图标
    },
    { 
        id: 'keegan', 
        name: "Keegan", 
        text: "Target secured. 你的礼物已确认安全送达，节日快乐。", 
        audio: "keegan.mp3",
        icon: "fa-user-secret" // 特工图标
    },
    { 
        id: 'konig', 
        name: "König", 
        text: "Merry Christmas... 我...我为你准备了一个惊喜，希望你不介意。", 
        audio: "konig.mp3",
        icon: "fa-mask" // 面具图标
    }
];

const ornamentTypes = [
    { icon: 'fa-star', color: '#FFD700' },
    { icon: 'fa-star', color: '#E0E0E0' },
    { icon: 'fa-heart', color: '#e91e63' },
    { icon: 'fa-gift', color: '#ff6b6b' },
    { icon: 'fa-bell', color: '#f39c12' }
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

    // 打字机
    const introText = "在这个温暖的冬夜，愿所有美好如期而至...";
    const introElement = document.getElementById('intro-text');
    const startBtn = document.getElementById('start-btn');
    
    typeWriter(introElement, introText, 200, () => {});

    // 启动
    const overlay = document.getElementById('start-overlay');
    const bgm = document.getElementById('bgm');

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
            bubble.innerText = char.name;
            
            const isLeft = index % 2 === 0;
            const leftPos = isLeft ? (5 + Math.random() * 10) : (75 + Math.random() * 10);
            const topStep = 40 / characters.length; 
            const topPos = 25 + (index * topStep) + (Math.random() * 5); // 泡泡位置也稍微调高了一点

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
        modalAuthor.innerText = char.name;
        viewModal.style.display = 'flex';
        
        if(charVoice && char.audio) {
            charVoice.src = char.audio; 
            charVoice.play().catch(()=>{});
        }
        typeWriter(modalText, char.text, 100, () => {});

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
            iconHtml = `<i class="fas ${type.icon}" style="color:${type.color}"></i>`;
        }
        ornament.innerHTML = iconHtml;

        let pos = getSafePosition(category === 'role', seed);
        ornament.style.top = `${pos.y}%`;
        ornament.style.left = `${pos.x}%`;
        occupiedPositions.push(pos);

        ornament.addEventListener('click', (e) => {
            e.stopPropagation();
            modalAuthor.innerText = category === 'role' ? data.name : `👤 ${data.name}`;
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

    // ============================================
    // 2. 核心算法修改：位置上移 (避开树干)
    // ============================================
    function getSafePosition(isRole, seed) {
        let maxAttempts = 30; 
        let safeDistance = 6; 
        
        for (let i = 0; i < maxAttempts; i++) {
            let currentSeed = seed + i * 100; 
            let r1 = seededRandom(currentSeed);
            let r2 = seededRandom(currentSeed + 1);
            
            // --- 调整高度范围 ---
            // 之前的范围大约是 15% - 88%
            // 现在上移 1/5，大约缩减底部的 20%
            // 新范围：12% (顶部) - 68% (底部)
            // 这样能确保星星都在树叶茂密的地方，完全避开树干
            let y = r1 * 56 + 12; 
            
            // 角色大星星尽量在更显眼的中上部 (12% - 42%)
            if(isRole) y = r1 * 30 + 12; 

            // --- 调整宽度 spread ---
            // 因为位置整体上移了，树的宽度计算也要适配 (三角形变宽的速度)
            // 系数调大一点点(0.8)，让星星能铺满树冠的左右边缘
            let spread = (y - 5) * 0.8; 
            if(spread > 90) spread = 90;

            let x = 50 + (r2 - 0.5) * spread;

            // 碰撞检测
            let collision = false;
            for (let p of occupiedPositions) {
                let dist = Math.sqrt(Math.pow(p.x - x, 2) + Math.pow(p.y - y, 2));
                if (dist < safeDistance) { collision = true; break; }
            }
            if (!collision) return { x, y };
        }
        
        // 兜底位置也相应上移
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
                        showToast("✨ 祝福已挂上树梢！"); writeModal.style.display = 'none';
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
                    li.innerHTML = `<strong>🎅 ${c.name}</strong>: ${c.text}`; list.appendChild(li);
                });
                allUserWishes.forEach(u => {
                    const li = document.createElement('li');
                    li.innerHTML = `<strong>👤 ${u.name}</strong>: ${u.text}`; list.appendChild(li);
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

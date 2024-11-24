const API_KEY = 'AIzaSyA3bjXPkJ6VesGq64sodSXQwL-XfYtDOok';
let player;
let accessToken = null;

// Categorias e palavras-chave associadas
const categories = {
    acao: ['filme ação completo', 'filme ação dublado'],
    comedia: ['filme comédia completo', 'filme comédia dublado'],
    drama: ['filme drama completo', 'filme drama dublado'],
    terror: ['filme terror completo', 'filme terror dublado']
};

// Função chamada quando o usuário faz login com sucesso
function onSignIn(googleUser) {
    const profile = googleUser.getBasicProfile();
    accessToken = googleUser.getAuthResponse().access_token;
    
    // Mostrar informações do usuário
    document.getElementById('userEmail').textContent = profile.getEmail();
    document.getElementById('userEmail').style.display = 'block';
    document.getElementById('signOutBtn').style.display = 'block';
    
    // Recarregar os vídeos com a autenticação
    loadMoviesByCategory('all');
}

// Função para fazer logout
function signOut() {
    const auth2 = gapi.auth2.getAuthInstance();
    auth2.signOut().then(() => {
        accessToken = null;
        document.getElementById('userEmail').style.display = 'none';
        document.getElementById('signOutBtn').style.display = 'none';
        loadMoviesByCategory('all');
    });
}

// Inicializar o player do YouTube com autenticação
function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        height: '100%',
        width: '100%',
        videoId: '',
        playerVars: {
            'autoplay': 0,
            'controls': 1,
            'rel': 0
        },
        events: {
            'onReady': onPlayerReady
        }
    });
}

function onPlayerReady(event) {
    // O player está pronto
    console.log('Player ready');
}

// Carregar vídeos iniciais
window.addEventListener('DOMContentLoaded', () => {
    loadMoviesByCategory('all');
    setupCategoryButtons();
    setupModal();
});

// Configurar botões de categoria
function setupCategoryButtons() {
    const categoryButtons = document.querySelectorAll('.category-btn');
    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            const category = button.dataset.category;
            loadMoviesByCategory(category);
        });
    });
}

// Configurar modal
function setupModal() {
    const modal = document.getElementById('modal');
    const closeButton = document.querySelector('.close-button');

    closeButton.addEventListener('click', () => {
        modal.style.display = 'none';
        if (player) {
            player.stopVideo();
        }
    });

    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
            if (player) {
                player.stopVideo();
            }
        }
    });
}

// Carregar vídeos por categoria
async function loadMoviesByCategory(category) {
    const container = document.getElementById('movies-container');
    container.innerHTML = '';

    try {
        let videos = [];
        if (category === 'all') {
            // Carregar alguns vídeos de cada categoria
            for (const cat in categories) {
                const categoryVideos = await searchYouTubeVideos(categories[cat][0], 3);
                videos = [...videos, ...categoryVideos];
            }
        } else {
            // Carregar vídeos da categoria específica
            videos = await searchYouTubeVideos(categories[category][0], 12);
        }

        videos.forEach(video => {
            const card = createMovieCard(video);
            container.appendChild(card);
        });
    } catch (error) {
        console.error('Erro ao carregar vídeos:', error);
        container.innerHTML = '<p>Erro ao carregar os vídeos. Por favor, tente novamente mais tarde.</p>';
    }
}

// Buscar vídeos no YouTube com autenticação
async function searchYouTubeVideos(query, maxResults = 12) {
    let url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=${maxResults}&videoDuration=long&key=${API_KEY}`;
    
    const headers = {
        'Accept': 'application/json'
    };
    
    // Adicionar token de acesso se o usuário estiver autenticado
    if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(url, { headers });
    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.error.message);
    }

    return data.items;
}

// Criar card de filme
function createMovieCard(video) {
    const card = document.createElement('div');
    card.className = 'movie-card';
    
    const thumbnail = video.snippet.thumbnails.high.url;
    const title = video.snippet.title;
    const videoId = video.id.videoId;

    card.innerHTML = `
        <img src="${thumbnail}" alt="${title}" class="movie-thumbnail">
        <div class="movie-info">
            <h3 class="movie-title">${title}</h3>
        </div>
    `;

    card.addEventListener('click', () => {
        openVideoModal(videoId);
    });

    return card;
}

// Abrir modal com vídeo
function openVideoModal(videoId) {
    const modal = document.getElementById('modal');
    modal.style.display = 'block';
    
    // Adicionar token de acesso ao player se disponível
    const playerVars = {
        'autoplay': 1,
        'controls': 1,
        'rel': 0
    };
    
    if (accessToken) {
        playerVars['auth'] = accessToken;
    }
    
    player.loadVideoById({
        videoId: videoId,
        playerVars: playerVars
    });
}

// Função de busca
function searchMovies() {
    const searchInput = document.getElementById('searchInput');
    const query = searchInput.value.trim();
    
    if (query) {
        searchYouTubeVideos(query + ' filme completo dublado')
            .then(videos => {
                const container = document.getElementById('movies-container');
                container.innerHTML = '';
                videos.forEach(video => {
                    const card = createMovieCard(video);
                    container.appendChild(card);
                });
            })
            .catch(error => {
                console.error('Erro na busca:', error);
            });
    }
}

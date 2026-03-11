// --- 1. SELECCIÓN DE ELEMENTOS DEL DOM ---
const pantallaInicio = document.getElementById('pantalla-inicio');
const pantallaReproductor = document.getElementById('pantalla-reproductor');
const gridSeries = document.getElementById('grid-series');
const btnVolverInicio = document.getElementById('btn-volver-inicio');

const reproductor = document.getElementById('reproductor');
const btnSkipIntro = document.getElementById('btn-skip-intro');
const btnSkipEnding = document.getElementById('btn-skip-ending');
const btnAbrirLista = document.getElementById('btn-abrir-lista');
const btnCerrarModal = document.getElementById('btn-cerrar-modal');
const modalEpisodios = document.getElementById('modal-episodios');
const listaVideos = document.getElementById('lista-videos');
const tituloModal = document.querySelector('.modal-contenido h2');

const pantallaTransicion = document.getElementById('pantalla-transicion');

const infoPausa = document.getElementById('info-pausa');
const pausaSerie = document.getElementById('pausa-serie');
const pausaCapitulo = document.getElementById('pausa-capitulo');

const btnPlayPause = document.getElementById('btn-play-pause');
const barraProgreso = document.getElementById('barra-progreso');
const barraProgresoContenedor = document.getElementById('barra-progreso-contenedor');
const tiempoTexto = document.getElementById('tiempo-texto');
const btnFullscreen = document.getElementById('btn-fullscreen');
const controlesVideo = document.getElementById('controles-video'); // Seleccionamos la barra completa

let catalogo = [];
let serieActivaIndex = 0;
let episodioActivoIndex = 0;
let mostrandoSeries = false;

// --- 2. INICIALIZACIÓN ---
async function inicializar() {
  try {
    const respuesta = await fetch('./js/data.json');
    catalogo = await respuesta.json();
    renderizarInicio(); // Mostrar portadas al abrir la app
  } catch (error) {
    console.error("Error cargando el JSON.", error);
  }
}

// --- 3. LÓGICA DE LA PANTALLA DE INICIO ---
function renderizarInicio() {
  gridSeries.innerHTML = ''; // Limpiar grilla

  catalogo.forEach((serie, index) => {
    const tarjeta = document.createElement('div');
    tarjeta.classList.add('tarjeta-serie');

    // Asignar imagen
    tarjeta.innerHTML = `
            <img src="${serie.portada}" alt="${serie.nombreSerie}" onerror="this.src='https://via.placeholder.com/220x320?text=Sin+Portada'">
            <h3>${serie.nombreSerie}</h3>
        `;

    // Al hacer clic en la portada, abrimos esa serie
    tarjeta.addEventListener('click', () => {
      abrirSerie(index);
    });

    gridSeries.appendChild(tarjeta);
  });
}

function abrirSerie(sIndex) {
  pantallaInicio.classList.add('oculto');
  pantallaReproductor.classList.remove('oculto');

  // Buscar si ya habíamos empezado a ver esta serie antes
  const epGuardado = localStorage.getItem(`ep_activo_serie_${sIndex}`);
  let eIndex = epGuardado !== null ? parseInt(epGuardado) : 0;

  // --- NUEVA LÍNEA DE SEGURIDAD ---
  // Si el número guardado es mayor a los episodios que realmente existen, lo reiniciamos a 0
  if (eIndex >= catalogo[sIndex].episodios.length) {
      eIndex = 0;
  }

  cargarVideo(sIndex, eIndex);
  reproductor.play(); 
}

// Botón para salir del video y volver a las portadas
btnVolverInicio.addEventListener('click', () => {
  reproductor.pause(); // Detener el video actual
  pantallaReproductor.classList.add('oculto');
  pantallaInicio.classList.remove('oculto');
});

// --- 4. LÓGICA DEL REPRODUCTOR ---
function cargarVideo(sIndex, eIndex) {
  serieActivaIndex = sIndex;
  episodioActivoIndex = eIndex;
  const episodioActual = catalogo[sIndex].episodios[eIndex];

  pausaSerie.textContent = catalogo[sIndex].nombreSerie;
  pausaCapitulo.textContent = episodioActual.titulo;

  reproductor.src = episodioActual.url;

  // Guardar en memoria qué episodio estamos viendo
  localStorage.setItem(`ep_activo_serie_${sIndex}`, eIndex);

  // Recuperar el minuto exacto del video
  const tiempoGuardado = localStorage.getItem(`tiempo_${episodioActual.idVideo}`);
  if (tiempoGuardado) {
    reproductor.currentTime = parseFloat(tiempoGuardado);
  }

  if (!mostrandoSeries && !modalEpisodios.classList.contains('oculto')) {
    renderizarEpisodios(sIndex);
  }
}

reproductor.addEventListener('timeupdate', () => {
  if (catalogo.length === 0) return;
  const episodioActual = catalogo[serieActivaIndex].episodios[episodioActivoIndex];
  const tiempoActual = reproductor.currentTime;

  // Autoguardado
  localStorage.setItem(`tiempo_${episodioActual.idVideo}`, tiempoActual);

  // Lógica para "Omitir Intro"
  if (tiempoActual >= episodioActual.introInicio && tiempoActual <= episodioActual.introFin) {
    btnSkipIntro.classList.remove('oculto');
  } else {
    btnSkipIntro.classList.add('oculto');
  }

  // Lógica para "Omitir Ending"
  if (tiempoActual >= episodioActual.endingInicio && tiempoActual <= episodioActual.endingFin) {
    btnSkipEnding.classList.remove('oculto');
  } else {
    btnSkipEnding.classList.add('oculto');
  }
});

btnSkipIntro.addEventListener('click', () => {
  reproductor.currentTime = catalogo[serieActivaIndex].episodios[episodioActivoIndex].introFin;
});

btnSkipEnding.addEventListener('click', reproducirSiguiente);
reproductor.addEventListener('ended', reproducirSiguiente);

function reproducirSiguiente() {
  const serieActual = catalogo[serieActivaIndex];
  const episodioActual = serieActual.episodios[episodioActivoIndex];

  // Reiniciar el contador del episodio
  localStorage.setItem(`tiempo_${episodioActual.idVideo}`, 0);

  if (episodioActivoIndex < serieActual.episodios.length - 1) {
    cargarVideo(serieActivaIndex, episodioActivoIndex + 1);
    reproductor.play();
  } else {
    reproductor.pause();
    btnSkipEnding.classList.add('oculto');
    btnSkipIntro.classList.add('oculto');
    localStorage.setItem(`ep_activo_serie_${serieActivaIndex}`, 0);

    pantallaReproductor.classList.add('oculto');
    pantallaTransicion.classList.remove('oculto');

    setTimeout(() => {
      pantallaTransicion.classList.add('oculto');
      pantallaInicio.classList.remove('oculto');
    }, 3000);
  }
}

// --- 5. LÓGICA DEL MODAL DE EPISODIOS ---
btnAbrirLista.addEventListener('click', () => {
  modalEpisodios.classList.remove('oculto');
  renderizarEpisodios(serieActivaIndex);
});

btnCerrarModal.addEventListener('click', () => {
  modalEpisodios.classList.add('oculto');
});

function renderizarEpisodios(sIndex) {
  mostrandoSeries = false;
  listaVideos.innerHTML = '';
  const serie = catalogo[sIndex];

  tituloModal.textContent = `Episodios de ${serie.nombreSerie}`;

  serie.episodios.forEach((ep, eIndex) => {
    const li = document.createElement('li');
    li.textContent = ep.titulo;

    if (sIndex === serieActivaIndex && eIndex === episodioActivoIndex) {
      li.classList.add('activo');
    }

    li.addEventListener('click', () => {
      cargarVideo(sIndex, eIndex);
      reproductor.play();
      modalEpisodios.classList.add('oculto');
    });

    listaVideos.appendChild(li);
  });
}

// --- EVENTOS DE REPRODUCCIÓN (MOSTRAR/OCULTAR OVERLAY Y MOUSE) ---
reproductor.addEventListener('pause', () => {
  if (!pantallaReproductor.classList.contains('oculto')) {
    infoPausa.classList.remove('oculto');
  }
});

reproductor.addEventListener('play', () => {
  infoPausa.classList.add('oculto');
});

// NUEVO: Ocultar controles y mouse si no hay movimiento
let timeoutMouse;
pantallaReproductor.addEventListener('mousemove', () => {
  // Mostramos todo al mover el mouse
  controlesVideo.classList.remove('oculto');
  btnVolverInicio.classList.remove('oculto');
  btnAbrirLista.classList.remove('oculto');
  pantallaReproductor.style.cursor = 'default'; // Cursor normal

  clearTimeout(timeoutMouse); // Reinicia el contador

  // Ocultamos todo después de 3 segundos (solo si el video está reproduciéndose)
  timeoutMouse = setTimeout(() => {
    if (!reproductor.paused) {
      controlesVideo.classList.add('oculto');
      btnVolverInicio.classList.add('oculto');
      btnAbrirLista.classList.add('oculto');
      pantallaReproductor.style.cursor = 'none'; // Desaparece el mouse
    }
  }, 3000);
});

// --- ATAJOS DE TECLADO ---
document.addEventListener('keydown', (e) => {
  if (pantallaReproductor.classList.contains('oculto')) return;

  switch (e.code) {
    case 'Space':
      e.preventDefault();
      if (reproductor.paused) reproductor.play();
      else reproductor.pause();
      break;

    case 'ArrowRight':
      reproductor.currentTime += 10;
      break;

    case 'ArrowLeft':
      reproductor.currentTime -= 10;
      break;

    case 'KeyF':
      if (!document.fullscreenElement) {
        pantallaReproductor.requestFullscreen().catch(err => console.log(err));
      } else {
        document.exitFullscreen();
      }
      break;
  }
});

// --- LÓGICA DE CONTROLES PERSONALIZADOS ---

function formatearTiempo(segundos) {
  if (isNaN(segundos)) return "00:00";
  const min = Math.floor(segundos / 60);
  const sec = Math.floor(segundos % 60);
  return `${min < 10 ? '0' : ''}${min}:${sec < 10 ? '0' : ''}${sec}`;
}

btnPlayPause.addEventListener('click', () => {
  if (reproductor.paused) reproductor.play();
  else reproductor.pause();
});

reproductor.addEventListener('play', () => btnPlayPause.textContent = '⏸');
reproductor.addEventListener('pause', () => btnPlayPause.textContent = '▶');

// NUEVO: Clic en el video directamente para pausar/reproducir
reproductor.addEventListener('click', () => {
  if (reproductor.paused) reproductor.play();
  else reproductor.pause();
});

reproductor.addEventListener('timeupdate', () => {
  const porcentaje = (reproductor.currentTime / reproductor.duration) * 100;
  barraProgreso.style.width = `${porcentaje}%`;
  tiempoTexto.textContent = `${formatearTiempo(reproductor.currentTime)} / ${formatearTiempo(reproductor.duration)}`;
});

barraProgresoContenedor.addEventListener('click', (e) => {
  const anchoTotal = barraProgresoContenedor.clientWidth;
  const clicX = e.offsetX;
  const nuevoTiempo = (clicX / anchoTotal) * reproductor.duration;
  reproductor.currentTime = nuevoTiempo;
});

btnFullscreen.addEventListener('click', () => {
  if (!document.fullscreenElement) {
    pantallaReproductor.requestFullscreen().catch(err => console.log(err));
  } else {
    document.exitFullscreen();
  }
});

// Arrancar la aplicación
inicializar();
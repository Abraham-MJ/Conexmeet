'use client';

import {
    createContext,
    useContext,
    useState,
    ReactNode,
    useEffect,
} from 'react';
import { Language, Translations, LanguageTranslations } from '../types/translations';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const translations: LanguageTranslations = {
    es: {
        // Modal Translate
        'modal.translate.title': 'Elige un idioma',
        'modal.translate.spanish': 'Español',
        'modal.translate.english': 'English',

        // Common
        'common.loading': 'Cargando...',
        'common.error': 'Error',
        'common.success': 'Éxito',
        'common.cancel': 'Cancelar',
        'common.accept': 'Aceptar',
        'common.close': 'Cerrar',
        'common.noData': 'No hay datos disponibles',
        'common.yes': 'Sí',
        'common.no': 'No',
        'common.save': 'Guardar',
        'common.edit': 'Editar',
        'common.delete': 'Eliminar',
        'common.confirm': 'Confirmar',
        'common.back': 'Atrás',
        'common.next': 'Siguiente',
        'common.previous': 'Anterior',
        'common.search': 'Buscar',
        'common.filter': 'Filtrar',
        'common.upload': 'Subir',
        'common.download': 'Descargar',
        'common.send': 'Enviar',
        'common.submit': 'Enviar',
        'common.continue': 'Continuar',

        // Navigation & UI
        'nav.home': 'Inicio',
        'nav.profile': 'Perfil',
        'nav.settings': 'Configuración',
        'nav.logout': 'Cerrar sesión',
        'nav.login': 'Iniciar sesión',
        'nav.register': 'Registrarse',
        'nav.messages': 'Mensajes',

        // Forms
        'form.email': 'Correo electrónico',
        'form.password': 'Contraseña',
        'form.confirmPassword': 'Confirmar contraseña',
        'form.currentPassword': 'Contraseña actual',
        'form.newPassword': 'Nueva contraseña',
        'form.username': 'Nombre de usuario',
        'form.name': 'Nombre',
        'form.phone': 'Teléfono',
        'form.required': 'Este campo es obligatorio',
        'form.invalidEmail': 'Correo electrónico inválido',
        'form.passwordMismatch': 'Las contraseñas no coinciden',

        // Profile
        'profile.title': 'Mi Perfil',
        'profile.edit': 'Editar Perfil',
        'profile.photo': 'Foto de perfil',
        'profile.changePhoto': 'Cambiar foto de perfil',
        'profile.updateSuccess': 'Perfil actualizado correctamente',
        'profile.updateError': 'Error al actualizar el perfil',
        'profile.referralLink': 'Link de Referido',
        'profile.shareLink': 'Comparte tu link y gana recompensas por cada referido',
        'profile.copied': '¡Copiado!',
        'profile.copy': 'Copiar',

        // Modals
        'modal.uploadStory.title': 'Subir Historia',
        'modal.uploadStory.selectVideo': 'Seleccionar video',
        'modal.uploadStory.removeVideo': 'Quitar video',
        'modal.uploadStory.upload': 'Subir',
        'modal.uploadStory.clickToUpload': 'Haz clic para subir',
        'modal.uploadStory.orDragDrop': 'o arrastra y suelta',
        'modal.insufficientMinutes.title': 'Minutos Insuficientes',
        'modal.insufficientMinutes.description': 'No tienes suficientes minutos disponibles para iniciar esta conexión.',
        'modal.insufficientMinutes.instruction': 'Por favor, recarga tu saldo para poder conectar con nuestras modelos.',
        'modal.insufficientMinutes.recharge': 'Recargar Minutos',
        'modal.minutesExhausted.title': '¡Se Han Agotado tus Minutos!',
        'modal.minutesExhausted.description': 'Tu tiempo en esta videollamada ha finalizado. Para seguir disfrutando de nuestras transmisiones',
        'modal.minutesExhausted.instruction': 'por favor, recarga tu saldo. ¡No te pierdas de nada!',
        'modal.minutesExhausted.rechargeNow': 'Recargar Ahora',
        'modal.channelBusy.title': 'Llamada Ocupada',
        'modal.channelBusy.description': 'La conexión que intentaste establecer ya se encuentra activa con otro usuario.',
        'modal.channelBusy.instruction': 'Por favor, elige otra modelo o inténtalo con esta más tarde.',
        'modal.permission.title': 'Preparando tu Conexión',
        'modal.permission.description': 'Estamos preparando tu cámara y micrófono. Por favor, acepta los permisos en la ventana emergente de tu navegador.',
        'modal.permission.cameraAccess': 'Acceso a la cámara',
        'modal.permission.cameraDescription': 'Para que otros puedan verte durante la llamada.',
        'modal.permission.micAccess': 'Acceso al micrófono',
        'modal.permission.micDescription': 'Para que otros puedan escucharte durante la llamada.',
        'modal.permission.note': 'Estos permisos son esenciales para el video chat. Una vez aceptados, puedes gestionarlos desde la configuración de tu navegador.',

        // Pagination
        'pagination.previous': 'Página anterior',
        'pagination.next': 'Página siguiente',
        'pagination.page': 'Página',

        // Accessibility
        'aria.close': 'Cerrar',
        'aria.menu': 'Menú',
        'aria.search': 'Buscar',
        'aria.image': 'Imagen',
        'aria.fileInput': 'Entrada de archivo',
        'aria.removeImage': 'Quitar imagen',
        'aria.messageInput': 'Entrada de mensaje',
        'aria.attachFile': 'Adjuntar archivo',
        'aria.sendMessage': 'Enviar mensaje',
        'aria.openEmojiPicker': 'Abrir selector de emojis',

        // Payments
        'payment.title': 'Pago',
        'payment.processing': 'Procesando pago...',
        'payment.success': 'Pago exitoso',
        'payment.error': 'Error en el pago',
        'payment.package': 'Paquete',
        'payment.specialOffer': '¡Oferta Especial de Primera Vez!',
        'payment.continuePurchase': 'Continuar Compra',
        'payment.selectPackage': 'Selecciona un Paquete',
        'payment.selectPackageDescription': 'Elige tu paquete de monedas para continuar',

        // Chat
        'chat.typeMessage': 'Escribe un mensaje...',
        'chat.send': 'Enviar',
        'chat.translate': 'Traducir',
        'chat.translating': 'Traduciendo...',
        'chat.imageSent': 'Imagen enviada',
        'chat.preview': 'Previsualización',
        'chat.welcome': 'Bienvenido',
        'chat.selectConversation': 'Selecciona una conversación de la lista para empezar a chatear.',

        // Video/Stream
        'video.connecting': 'Conectando...',
        'video.connected': 'Conectado',
        'video.disconnected': 'Desconectado',
        'video.mute': 'Silenciar',
        'video.unmute': 'Activar sonido',
        'video.camera': 'Cámara',
        'video.endCall': 'Finalizar llamada',
        'video.addVideo': 'Agregar video',
        'video.nextChannel': 'Siguiente canal',
        'video.openChat': 'Abrir chat',
        'video.saySomething': 'Di algo...',
        'video.previousStory': 'Historia anterior',
        'video.nextStory': 'Siguiente historia',
        'video.changingChannel': 'Cambiando de canal...',
        'video.storyContent': 'Contenido de historia',
        'video.storyLiked': 'Historia gustada',
        'video.likeStory': 'Me gusta esta historia',
        'video.contactAdded': 'Contacto agregado',
        'video.addContact': 'Agregar contacto',
        'video.addShortVideo': 'Agrega un video corto.',
        'video.earnPointsForLikes': 'Obtén puntos por likes.',

        // General UI
        'ui.searchInChats': 'Buscar en chats...',
        'ui.goToEnd': 'Ir al final',
        'ui.userInfoNotAvailable': 'Información de usuario no disponible.',

        // Tabs
        'tabs.online': 'EN LÍNEA',
        'tabs.stories': 'HISTORIAS',
        'tabs.contacts': 'CONTACTOS',
        'tabs.ranking': 'RANKING',
        'tabs.referrals': 'REFERIDOS',
        'tabs.gifts': 'REGALOS',

        // Content
        'content.storyPreview': 'Vista previa de la historia de',

        // Status
        'status.online': 'En línea',
        'status.availableForCall': 'Disponible para llamada',
        'status.inCallWithOther': 'En llamada con otro usuario',
        'status.disconnected': 'Desconectado',

        // Header
        'header.forYou': 'Para ti',
        'header.videoChat': 'Video Chat',
        'header.chats': 'Chats',
        'header.ranking': 'Ranking',
        'header.myContacts': 'Mis Contactos',
        'header.contacts': 'Contactos',
        'header.balance': 'Saldo',
        'header.minutes': 'Minutos',
        'header.recharge': 'Recargar',

        // Pages
        'pages.contacts.title': 'Tus contactos',

        // Errors
        'errors.sendMessage': 'Error al enviar mensaje',

        // Ranking
        'ranking.position': 'Posición',
        'ranking.photo': 'Foto',
        'ranking.name': 'Nombre',
        'ranking.minutes': 'Minutos',
        'ranking.calculatingPosition': 'Calculando tu posición...',
        'ranking.loadingRanking': 'Cargando ranking...',
        'ranking.errorProcessingTime': 'Error procesando tu tiempo.',
        'ranking.noRankingData': 'No hay datos de ranking disponibles.',
        'ranking.congratulations': '¡Felicidades! Estás',
        'ranking.number1': '#1',
        'ranking.inRanking': 'en el ranking. ¡Sigue así!',
        'ranking.positionUpdating': '¡Tu posición en el ranking se está actualizando!',
        'ranking.previousPosition': 'Pos. Anterior:',
        'ranking.inTop': '¡Estás en el Top',
        'ranking.needPoints': '! Necesitas',
        'ranking.morePoints': 'más puntos para alcanzar el',
        'ranking.youNeed': 'Tú: Necesitas',
        'ranking.morePointsToRise': 'Más puntos para subir en el ranking.',
        'ranking.youHavePoints': 'Tienes',
        'ranking.pointsSufficient': 'puntos. ¡Suficientes para entrar en esta lista! Actualizando...',
        'ranking.morePointsToEnter': 'Más puntos para entrar en el top',
        'ranking.ofRanking': 'del ranking.',
        'ranking.yourPoints': '(Tus puntos:',

        // Video Roulette
        'videoRoulette.likes': 'Me gusta',
        'videoRoulette.play': 'Reproducir',
        'videoRoulette.record': 'Grabar',
        'videoRoulette.blocked': 'Bloqueado',
        'videoRoulette.female.title': 'Conecta con Chicos',
        'videoRoulette.female.instruction': 'Toca el botón para comenzar a chatear',
        'videoRoulette.male.title1': 'Conecta con',
        'videoRoulette.male.title2': 'Chicas Reales',
        'videoRoulette.male.enterVideoChat': 'Entrar al Video Chat',
        'videoRoulette.male.instruction': 'Presiona el botón para conectar con chicas en vivo',

        // Features
        'features.onlineNow': 'En línea ahora',
        'features.stories': 'Historias',
        'features.yourContacts': 'Tus contactos',
        'features.blocked': 'Bloqueado',

        // Landing Page
        'landing.header.agencies': 'Agencias',
        'landing.header.signInRegister': 'Iniciar Sesión / Registrarse',
        'landing.hero.title': 'Una plataforma global',
        'landing.hero.titleHighlight': 'de video chat',
        'landing.hero.subtitle': 'Para la interacción y comunicación entre personas de todo el mundo',
        'landing.hero.videoChat': 'Video Chat',
        'landing.hero.messaging': 'Mensajería',
        'landing.hero.gifts': 'Regalos',
        'landing.hero.personToPerson': 'Persona a Persona',
        'landing.hero.startVideoChat': 'Empezar Video Chat',
        'landing.hero.imageAlt': 'Conexmeet - Plataforma de Video Chat',

        // Authentication
        'auth.signIn.title': 'Iniciar Sesión',
        'auth.signIn.email': 'Correo electrónico:',
        'auth.signIn.emailPlaceholder': 'Correo electrónico',
        'auth.signIn.password': 'Contraseña:',
        'auth.signIn.passwordPlaceholder': 'Contraseña',
        'auth.signIn.loading': 'Cargando',
        'auth.signIn.submit': 'Iniciar sesión',
        'auth.signIn.forgotPassword': '¿Olvidaste tu contraseña?',
        'auth.signIn.noAccount': '¿No tienes cuenta?, Registrate',
        'auth.signIn.sessionActive': 'Ya hay una sesión activa. Intente nuevamente',

        // Sign Up
        'auth.signUp.step1.gender': 'Sexo:',
        'auth.signUp.step1.genderPlaceholder': 'Escoge tu sexo',
        'auth.signUp.step1.male': 'Masculino',
        'auth.signUp.step1.female': 'Femenino',
        'auth.signUp.step1.name': 'Nombre:',
        'auth.signUp.step1.namePlaceholder': 'Nombre',
        'auth.signUp.step1.lastName': 'Apellido:',
        'auth.signUp.step1.lastNamePlaceholder': 'Apellido',
        'auth.signUp.step1.email': 'Correo electrónico:',
        'auth.signUp.step1.emailPlaceholder': 'Correo@ejemplo.com',
        'auth.signUp.step1.username': 'Nombre de usuario:',
        'auth.signUp.step1.usernamePlaceholder': '@Usuario',

        'auth.signUp.step2.birthDate': 'Fecha de nacimiento:',
        'auth.signUp.step2.birthDatePlaceholder': 'DD/MM/AAAA',
        'auth.signUp.step2.password': 'Contraseña:',
        'auth.signUp.step2.passwordPlaceholder': 'Contraseña',
        'auth.signUp.step2.confirmPassword': 'Confirmar contraseña:',
        'auth.signUp.step2.confirmPasswordPlaceholder': 'Confirmar contraseña',
        'auth.signUp.step2.country': 'País:',
        'auth.signUp.step2.countryPlaceholder': 'Selecciona tu país',
        'auth.signUp.step2.phone': 'Número de teléfono (opcional):',
        'auth.signUp.step2.phonePlaceholder': 'Número de teléfono',
        'auth.signUp.step2.privacy': 'Acepto las',
        'auth.signUp.step2.privacyLink': 'políticas de privacidad',

        'auth.signUp.step3.verificationSent': 'Se ha enviado un código de verificación a tu correo electrónico.',
        'auth.signUp.step3.verificationCode': 'Código de verificación:',
        'auth.signUp.step3.verificationCodePlaceholder': 'Ingresa el código',
        'auth.signUp.step3.resendCode': 'Reenviar código',
        'auth.signUp.step3.resendIn': 'Reenviar en:',

        'auth.signUp.navigation.back': 'Atrás',
        'auth.signUp.navigation.next': 'Siguiente',
        'auth.signUp.navigation.validateCode': 'Validar código',
        'auth.signUp.hasAccount': '¿Ya tienes cuenta?, Inicia sesión',

        'auth.signUp.congrats.loading': 'Registro en progreso...',
        'auth.signUp.congrats.success': '¡Registro exitoso!',
        'auth.signUp.congrats.successMessage': 'Tu cuenta ha sido creada correctamente.',
        'auth.signUp.congrats.signIn': 'Iniciar sesión',
        'auth.signUp.congrats.error': 'Error en el registro',
        'auth.signUp.congrats.errorMessage': 'Ha ocurrido un error al procesar tu registro. Por favor, inténtalo de nuevo',
        'auth.signUp.congrats.errorEmailExists': 'El email ya se encuentra registrado',
        'auth.signUp.congrats.backToStart': 'Volver al inicio',

        // Password Recovery
        'auth.recovery.title': 'Recuperar Contraseña',
        'auth.recovery.instruction': 'Ingresa tu correo electrónico para recuperar tu contraseña',
        'auth.recovery.successMessage': 'Hemos enviado un enlace de recuperación a tu correo electrónico. Revisa tu bandeja de entrada y spam.',
        'auth.recovery.email': 'Correo electrónico:',
        'auth.recovery.emailPlaceholder': 'Correo electrónico',
        'auth.recovery.send': 'Enviar',
        'auth.recovery.signIn': 'Iniciar sesión',
        'auth.recovery.emailNotExists': 'El email no existe',

        // Password Reset
        'auth.reset.validating': 'Validando datos...',
        'auth.reset.error': 'Ha ocurrido un error',
        'auth.reset.errorMessage': 'El token ya se venció o fue usado anteriormente. Inténtelo nuevamente.',
        'auth.reset.backToRecovery': 'Volver al inicio',
        'auth.reset.success': 'Cambio de contraseña',
        'auth.reset.successMessage': 'Su contraseña ha sido cambiada exitosamente',
        'auth.reset.newPassword': 'Nueva contraseña:',
        'auth.reset.newPasswordPlaceholder': 'Nueva contraseña',
        'auth.reset.confirmPassword': 'Confirmar contraseña:',
        'auth.reset.confirmPasswordPlaceholder': 'Confirmar contraseña',
        'auth.reset.submit': 'Recuperar contraseña',

        // Modals - KYC
        'modal.kyc.title': 'Verificación de Identidad (KYC):',
        'modal.kyc.description': 'Para cumplir con las regulaciones y mantener tu cuenta segura, necesitamos verificar tu identidad. El proceso es rápido y sencillo.',
        'modal.kyc.step': 'Paso',
        'modal.kyc.of': 'de',
        'modal.kyc.front': 'Frente del pasaporte',
        'modal.kyc.frontDescription': 'Una foto clara y legible de la página principal de tu pasaporte.',
        'modal.kyc.back': 'Reverso del pasaporte',
        'modal.kyc.backDescription': 'Una foto de la parte trasera de tu pasaporte.',
        'modal.kyc.selfie': 'Foto sosteniendo el pasaporte',
        'modal.kyc.selfieDescription': 'Una selfie tuya sosteniendo tu pasaporte abierto en la página de la foto.',
        'modal.kyc.uploadFront': 'Sube el frente de tu pasaporte',
        'modal.kyc.uploadBack': 'Sube el reverso de tu pasaporte',
        'modal.kyc.uploadSelfie': 'Sube tu foto sosteniendo el pasaporte',
        'modal.kyc.clickToUpload': 'Haz clic para subir un archivo',
        'modal.kyc.dragDrop': 'o arrástralo y suéltalo aquí',
        'modal.kyc.fileSelected': 'Archivo seleccionado. Haz clic para cambiar.',
        'modal.kyc.previous': 'Anterior',
        'modal.kyc.next': 'Siguiente',
        'modal.kyc.startVerification': 'Comenzar Verificación',
        'modal.kyc.submit': 'Enviar',
        'modal.kyc.sending': 'Enviando',

        // Modals - Gallery
        'modal.gallery.imageOf': 'Imagen',
        'modal.gallery.of': 'de',

        // Modals - Rating
        'modal.rating.title': 'Califica tu experiencia',
        'modal.rating.description': 'Tu opinión nos ayuda a mejorar nuestro servicio.',
        'modal.rating.experienceWith': '¿Cómo fue tu experiencia con',
        'modal.rating.rateStars': 'Calificar con',
        'modal.rating.stars': 'estrellas',
        'modal.rating.comments': 'Comentarios adicionales (opcional)',
        'modal.rating.commentsPlaceholder': 'Cuéntanos qué podemos mejorar...',
        'modal.rating.submit': 'Enviar Calificación',
        'modal.rating.sending': 'Enviando...',

        // Modals - Package
        'modal.package.minutes': 'Minutos:',

        // Modals - Channel Not Found
        'modal.channelNotFound.title': '¡Te avisamos cuando {name} esté disponible!',
        'modal.channelNotFound.description': 'En este momento {name} no se encuentra en línea. Podemos enviarte una notificación justo cuando se conecte.',
        'modal.channelNotFound.notify': 'Sí, avísame',
        'modal.channelNotFound.noThanks': 'No, gracias',

        // Video/Call
        'video.call': 'Llamar',
        'video.startCall': 'Iniciar llamada',
        'video.inCall': 'En llamada',
        'video.notAvailable': 'No disponible',
        'video.notAvailableForCall': 'Usuario no disponible para llamada',

        // Chat Additional
        'chat.typing': 'Escribiendo',

        // Modal - Call Ended
        'modal.callEnded.title': 'Llamada Finalizada',
        'modal.callEnded.reason': 'Motivo',
        'modal.callEnded.duration': 'Duración',
        'modal.callEnded.earnings': 'Ganancias',
        'modal.callEnded.endedByYou': 'Finalizada por ti',
        'modal.callEnded.userEnded': 'Usuario finalizó la llamada',
        'modal.callEnded.balanceExhausted': 'Saldo agotado',
        'modal.callEnded.unexpectedDisconnection': 'Desconexión inesperada',

        // Modal - Channel Hopping
        'modal.channelHopping.title': 'Acceso Temporalmente Bloqueado',
        'modal.channelHopping.description1': 'Has cambiado de modelo muy rápidamente varias veces seguidas.',
        'modal.channelHopping.description2': 'Para mantener una experiencia de calidad, el video chat está temporalmente deshabilitado.',
        'modal.channelHopping.timeRemaining': 'Tiempo restante de bloqueo',
        'modal.channelHopping.tips': 'Consejos',
        'modal.channelHopping.tip1': 'Permanece al menos 15 segundos con cada modelo',
        'modal.channelHopping.tip2': 'Si permaneces 1+ minuto, el contador se reinicia',
        'modal.channelHopping.tip3': 'Puedes seguir en tu llamada actual normalmente',
        'modal.channelHopping.understood': 'Entendido',

        // Modal - No Models
        'modal.noModels.title': 'Modelos No Disponibles',
        'modal.noModels.description': 'Lo sentimos, en este momento no hay modelos disponibles para iniciar una conexión.',
        'modal.noModels.instruction': 'Por favor, inténtalo de nuevo más tarde. Estamos trabajando para que siempre tengas opciones.',

        // Modal - Permission Denied
        'modal.permissionDenied.title': 'Permisos Denegados',
        'modal.permissionDenied.description': 'No pudimos acceder a tu cámara o micrófono. Para continuar, necesitamos que otorgues los permisos necesarios.',
        'modal.permissionDenied.solutionsTitle': 'Posibles soluciones',
        'modal.permissionDenied.solution1': 'Asegúrate de haber aceptado los permisos en la ventana emergente de tu navegador.',
        'modal.permissionDenied.solution2': 'Verifica la configuración de privacidad de tu navegador y sistema operativo.',
        'modal.permissionDenied.solution3': 'Asegúrate de que tus dispositivos (cámara/micrófono) estén conectados y no siendo usados por otra aplicación.',
    },
    en: {
        // Modal Translate
        'modal.translate.title': 'Choose a language',
        'modal.translate.spanish': 'Español',
        'modal.translate.english': 'English',

        // Common
        'common.loading': 'Loading...',
        'common.error': 'Error',
        'common.success': 'Success',
        'common.cancel': 'Cancel',
        'common.accept': 'Accept',
        'common.close': 'Close',
        'common.noData': 'No data available',
        'common.yes': 'Yes',
        'common.no': 'No',
        'common.save': 'Save',
        'common.edit': 'Edit',
        'common.delete': 'Delete',
        'common.confirm': 'Confirm',
        'common.back': 'Back',
        'common.next': 'Next',
        'common.previous': 'Previous',
        'common.search': 'Search',
        'common.filter': 'Filter',
        'common.upload': 'Upload',
        'common.download': 'Download',
        'common.send': 'Send',
        'common.submit': 'Submit',
        'common.continue': 'Continue',

        // Navigation & UI
        'nav.home': 'Home',
        'nav.profile': 'Profile',
        'nav.settings': 'Settings',
        'nav.logout': 'Logout',
        'nav.login': 'Login',
        'nav.register': 'Register',
        'nav.messages': 'Messages',

        // Forms
        'form.email': 'Email',
        'form.password': 'Password',
        'form.confirmPassword': 'Confirm password',
        'form.currentPassword': 'Current password',
        'form.newPassword': 'New password',
        'form.username': 'Username',
        'form.name': 'Name',
        'form.phone': 'Phone',
        'form.required': 'This field is required',
        'form.invalidEmail': 'Invalid email',
        'form.passwordMismatch': 'Passwords do not match',

        // Profile
        'profile.title': 'My Profile',
        'profile.edit': 'Edit Profile',
        'profile.photo': 'Profile photo',
        'profile.changePhoto': 'Change profile photo',
        'profile.updateSuccess': 'Profile updated successfully',
        'profile.updateError': 'Error updating profile',
        'profile.referralLink': 'Referral Link',
        'profile.shareLink': 'Share your link and earn rewards for each referral',
        'profile.copied': 'Copied!',
        'profile.copy': 'Copy',

        // Modals
        'modal.uploadStory.title': 'Upload Story',
        'modal.uploadStory.selectVideo': 'Select video',
        'modal.uploadStory.removeVideo': 'Remove video',
        'modal.uploadStory.upload': 'Upload',
        'modal.uploadStory.clickToUpload': 'Click to upload',
        'modal.uploadStory.orDragDrop': 'or drag and drop',
        'modal.insufficientMinutes.title': 'Insufficient Minutes',
        'modal.insufficientMinutes.description': 'You don\'t have enough minutes available to start this connection.',
        'modal.insufficientMinutes.instruction': 'Please recharge your balance to connect with our models.',
        'modal.insufficientMinutes.recharge': 'Recharge Minutes',
        'modal.minutesExhausted.title': 'Your Minutes Have Run Out!',
        'modal.minutesExhausted.description': 'Your time in this video call has ended. To continue enjoying our broadcasts',
        'modal.minutesExhausted.instruction': 'please recharge your balance. Don\'t miss out on anything!',
        'modal.minutesExhausted.rechargeNow': 'Recharge Now',
        'modal.channelBusy.title': 'Call Busy',
        'modal.channelBusy.description': 'The connection you tried to establish is already active with another user.',
        'modal.channelBusy.instruction': 'Please choose another model or try again with this one later.',
        'modal.permission.title': 'Preparing Your Connection',
        'modal.permission.description': 'We are preparing your camera and microphone. Please accept the permissions in your browser\'s popup window.',
        'modal.permission.cameraAccess': 'Camera Access',
        'modal.permission.cameraDescription': 'So others can see you during the call.',
        'modal.permission.micAccess': 'Microphone Access',
        'modal.permission.micDescription': 'So others can hear you during the call.',
        'modal.permission.note': 'These permissions are essential for video chat. Once accepted, you can manage them from your browser settings.',

        // Pagination
        'pagination.previous': 'Previous page',
        'pagination.next': 'Next page',
        'pagination.page': 'Page',

        // Accessibility
        'aria.close': 'Close',
        'aria.menu': 'Menu',
        'aria.search': 'Search',
        'aria.image': 'Image',
        'aria.fileInput': 'File input',
        'aria.removeImage': 'Remove image',
        'aria.messageInput': 'Message input',
        'aria.attachFile': 'Attach file',
        'aria.sendMessage': 'Send message',
        'aria.openEmojiPicker': 'Open emoji picker',

        // Payments
        'payment.title': 'Payment',
        'payment.processing': 'Processing payment...',
        'payment.success': 'Payment successful',
        'payment.error': 'Payment error',
        'payment.package': 'Package',
        'payment.specialOffer': 'First Time Special Offer!',
        'payment.continuePurchase': 'Continue Purchase',
        'payment.selectPackage': 'Select a Package',
        'payment.selectPackageDescription': 'Choose your coin package to continue',

        // Chat
        'chat.typeMessage': 'Type a message...',
        'chat.send': 'Send',
        'chat.translate': 'Translate',
        'chat.translating': 'Translating...',
        'chat.imageSent': 'Image sent',
        'chat.preview': 'Preview',
        'chat.welcome': 'Welcome',
        'chat.selectConversation': 'Select a conversation from the list to start chatting.',

        // Video/Stream
        'video.connecting': 'Connecting...',
        'video.connected': 'Connected',
        'video.disconnected': 'Disconnected',
        'video.mute': 'Mute',
        'video.unmute': 'Unmute',
        'video.camera': 'Camera',
        'video.endCall': 'End call',
        'video.addVideo': 'Add video',
        'video.nextChannel': 'Next channel',
        'video.openChat': 'Open chat',
        'video.saySomething': 'Say something...',
        'video.previousStory': 'Previous story',
        'video.nextStory': 'Next story',
        'video.changingChannel': 'Changing channel...',
        'video.storyContent': 'Story content',
        'video.storyLiked': 'Story liked',
        'video.likeStory': 'Like this story',
        'video.contactAdded': 'Contact added',
        'video.addContact': 'Add contact',
        'video.addShortVideo': 'Add a short video.',
        'video.earnPointsForLikes': 'Earn points for likes.',

        // General UI
        'ui.searchInChats': 'Search in chats...',
        'ui.goToEnd': 'Go to end',
        'ui.userInfoNotAvailable': 'User information not available.',

        // Tabs
        'tabs.online': 'ONLINE',
        'tabs.stories': 'STORIES',
        'tabs.contacts': 'CONTACTS',
        'tabs.ranking': 'RANKING',
        'tabs.referrals': 'REFERRALS',
        'tabs.gifts': 'GIFTS',

        // Content
        'content.storyPreview': 'Story preview of',

        // Status
        'status.online': 'Online',
        'status.availableForCall': 'Available for call',
        'status.inCallWithOther': 'In call with another user',
        'status.disconnected': 'Disconnected',

        // Header
        'header.forYou': 'For You',
        'header.videoChat': 'Video Chat',
        'header.chats': 'Chats',
        'header.ranking': 'Ranking',
        'header.myContacts': 'My Contacts',
        'header.contacts': 'Contacts',
        'header.balance': 'Balance',
        'header.minutes': 'Minutes',
        'header.recharge': 'Recharge',

        // Pages
        'pages.contacts.title': 'Your contacts',

        // Errors
        'errors.sendMessage': 'Error sending message',

        // Ranking
        'ranking.position': 'Position',
        'ranking.photo': 'Photo',
        'ranking.name': 'Name',
        'ranking.minutes': 'Minutes',
        'ranking.calculatingPosition': 'Calculating your position...',
        'ranking.loadingRanking': 'Loading ranking...',
        'ranking.errorProcessingTime': 'Error processing your time.',
        'ranking.noRankingData': 'No ranking data available.',
        'ranking.congratulations': 'Congratulations! You are',
        'ranking.number1': '#1',
        'ranking.inRanking': 'in the ranking. Keep it up!',
        'ranking.positionUpdating': 'Your ranking position is updating!',
        'ranking.previousPosition': 'Previous Pos.:',
        'ranking.inTop': 'You are in the Top',
        'ranking.needPoints': '! You need',
        'ranking.morePoints': 'more points to reach',
        'ranking.youNeed': 'You: Need',
        'ranking.morePointsToRise': 'More points to rise in the ranking.',
        'ranking.youHavePoints': 'You have',
        'ranking.pointsSufficient': 'points. Enough to enter this list! Updating...',
        'ranking.morePointsToEnter': 'More points to enter the top',
        'ranking.ofRanking': 'of the ranking.',
        'ranking.yourPoints': '(Your points:',

        // Video Roulette
        'videoRoulette.likes': 'Likes',
        'videoRoulette.play': 'Play',
        'videoRoulette.record': 'Record',
        'videoRoulette.blocked': 'Blocked',
        'videoRoulette.female.title': 'Connect with Guys',
        'videoRoulette.female.instruction': 'Tap the button to start chatting',
        'videoRoulette.male.title1': 'Connect with',
        'videoRoulette.male.title2': 'Real Girls',
        'videoRoulette.male.enterVideoChat': 'Enter Video Chat',
        'videoRoulette.male.instruction': 'Press the button to connect with live girls',

        // Features
        'features.onlineNow': 'Online now',
        'features.stories': 'Stories',
        'features.yourContacts': 'Your contacts',
        'features.blocked': 'Blocked',

        // Landing Page
        'landing.header.agencies': 'Agencies',
        'landing.header.signInRegister': 'Sign In / Register',
        'landing.hero.title': 'A global platform',
        'landing.hero.titleHighlight': 'for video chat',
        'landing.hero.subtitle': 'For interaction and communication between people from all over the world',
        'landing.hero.videoChat': 'Video Chat',
        'landing.hero.messaging': 'Messaging',
        'landing.hero.gifts': 'Gifts',
        'landing.hero.personToPerson': 'Person to Person',
        'landing.hero.startVideoChat': 'Start Video Chat',
        'landing.hero.imageAlt': 'Conexmeet - Video Chat Platform',

        // Authentication
        'auth.signIn.title': 'Sign In',
        'auth.signIn.email': 'Email:',
        'auth.signIn.emailPlaceholder': 'Email',
        'auth.signIn.password': 'Password:',
        'auth.signIn.passwordPlaceholder': 'Password',
        'auth.signIn.loading': 'Loading',
        'auth.signIn.submit': 'Sign In',
        'auth.signIn.forgotPassword': 'Forgot your password?',
        'auth.signIn.noAccount': 'Don\'t have an account? Sign up',
        'auth.signIn.sessionActive': 'There is already an active session. Please try again',

        // Sign Up
        'auth.signUp.step1.gender': 'Gender:',
        'auth.signUp.step1.genderPlaceholder': 'Choose your gender',
        'auth.signUp.step1.male': 'Male',
        'auth.signUp.step1.female': 'Female',
        'auth.signUp.step1.name': 'Name:',
        'auth.signUp.step1.namePlaceholder': 'Name',
        'auth.signUp.step1.lastName': 'Last Name:',
        'auth.signUp.step1.lastNamePlaceholder': 'Last Name',
        'auth.signUp.step1.email': 'Email:',
        'auth.signUp.step1.emailPlaceholder': 'Email@example.com',
        'auth.signUp.step1.username': 'Username:',
        'auth.signUp.step1.usernamePlaceholder': '@Username',

        'auth.signUp.step2.birthDate': 'Date of Birth:',
        'auth.signUp.step2.birthDatePlaceholder': 'DD/MM/YYYY',
        'auth.signUp.step2.password': 'Password:',
        'auth.signUp.step2.passwordPlaceholder': 'Password',
        'auth.signUp.step2.confirmPassword': 'Confirm Password:',
        'auth.signUp.step2.confirmPasswordPlaceholder': 'Confirm Password',
        'auth.signUp.step2.country': 'Country:',
        'auth.signUp.step2.countryPlaceholder': 'Select your country',
        'auth.signUp.step2.phone': 'Phone Number (optional):',
        'auth.signUp.step2.phonePlaceholder': 'Phone Number',
        'auth.signUp.step2.privacy': 'I accept the',
        'auth.signUp.step2.privacyLink': 'privacy policies',

        'auth.signUp.step3.verificationSent': 'A verification code has been sent to your email.',
        'auth.signUp.step3.verificationCode': 'Verification Code:',
        'auth.signUp.step3.verificationCodePlaceholder': 'Enter the code',
        'auth.signUp.step3.resendCode': 'Resend code',
        'auth.signUp.step3.resendIn': 'Resend in:',

        'auth.signUp.navigation.back': 'Back',
        'auth.signUp.navigation.next': 'Next',
        'auth.signUp.navigation.validateCode': 'Validate code',
        'auth.signUp.hasAccount': 'Already have an account? Sign in',

        'auth.signUp.congrats.loading': 'Registration in progress...',
        'auth.signUp.congrats.success': 'Registration successful!',
        'auth.signUp.congrats.successMessage': 'Your account has been created successfully.',
        'auth.signUp.congrats.signIn': 'Sign In',
        'auth.signUp.congrats.error': 'Registration error',
        'auth.signUp.congrats.errorMessage': 'An error occurred while processing your registration. Please try again',
        'auth.signUp.congrats.errorEmailExists': 'The email is already registered',
        'auth.signUp.congrats.backToStart': 'Back to start',

        // Password Recovery
        'auth.recovery.title': 'Password Recovery',
        'auth.recovery.instruction': 'Enter your email to recover your password',
        'auth.recovery.successMessage': 'We have sent a recovery link to your email. Check your inbox and spam folder.',
        'auth.recovery.email': 'Email:',
        'auth.recovery.emailPlaceholder': 'Email',
        'auth.recovery.send': 'Send',
        'auth.recovery.signIn': 'Sign In',
        'auth.recovery.emailNotExists': 'The email does not exist',

        // Password Reset
        'auth.reset.validating': 'Validating data...',
        'auth.reset.error': 'An error occurred',
        'auth.reset.errorMessage': 'The token has expired or was used previously. Please try again.',
        'auth.reset.backToRecovery': 'Back to start',
        'auth.reset.success': 'Password Change',
        'auth.reset.successMessage': 'Your password has been changed successfully',
        'auth.reset.newPassword': 'New Password:',
        'auth.reset.newPasswordPlaceholder': 'New Password',
        'auth.reset.confirmPassword': 'Confirm Password:',
        'auth.reset.confirmPasswordPlaceholder': 'Confirm Password',
        'auth.reset.submit': 'Reset Password',

        // Modals - KYC
        'modal.kyc.title': 'Identity Verification (KYC):',
        'modal.kyc.description': 'To comply with regulations and keep your account secure, we need to verify your identity. The process is quick and simple.',
        'modal.kyc.step': 'Step',
        'modal.kyc.of': 'of',
        'modal.kyc.front': 'Passport front',
        'modal.kyc.frontDescription': 'A clear and legible photo of the main page of your passport.',
        'modal.kyc.back': 'Passport back',
        'modal.kyc.backDescription': 'A photo of the back of your passport.',
        'modal.kyc.selfie': 'Photo holding passport',
        'modal.kyc.selfieDescription': 'A selfie of you holding your passport open to the photo page.',
        'modal.kyc.uploadFront': 'Upload the front of your passport',
        'modal.kyc.uploadBack': 'Upload the back of your passport',
        'modal.kyc.uploadSelfie': 'Upload your photo holding the passport',
        'modal.kyc.clickToUpload': 'Click to upload a file',
        'modal.kyc.dragDrop': 'or drag and drop it here',
        'modal.kyc.fileSelected': 'File selected. Click to change.',
        'modal.kyc.previous': 'Previous',
        'modal.kyc.next': 'Next',
        'modal.kyc.startVerification': 'Start Verification',
        'modal.kyc.submit': 'Submit',
        'modal.kyc.sending': 'Sending',

        // Modals - Gallery
        'modal.gallery.imageOf': 'Image',
        'modal.gallery.of': 'of',

        // Modals - Rating
        'modal.rating.title': 'Rate your experience',
        'modal.rating.description': 'Your feedback helps us improve our service.',
        'modal.rating.experienceWith': 'How was your experience with',
        'modal.rating.rateStars': 'Rate with',
        'modal.rating.stars': 'stars',
        'modal.rating.comments': 'Additional comments (optional)',
        'modal.rating.commentsPlaceholder': 'Tell us what we can improve...',
        'modal.rating.submit': 'Submit Rating',
        'modal.rating.sending': 'Sending...',

        // Modals - Package
        'modal.package.minutes': 'Minutes:',

        // Modals - Channel Not Found
        'modal.channelNotFound.title': 'We\'ll notify you when {name} is available!',
        'modal.channelNotFound.description': 'Right now {name} is not online. We can send you a notification as soon as they connect.',
        'modal.channelNotFound.notify': 'Yes, notify me',
        'modal.channelNotFound.noThanks': 'No, thanks',

        // Video/Call
        'video.call': 'Call',
        'video.startCall': 'Start call',
        'video.inCall': 'In call',
        'video.notAvailable': 'Not available',
        'video.notAvailableForCall': 'User not available for call',

        // Chat Additional
        'chat.typing': 'Typing',

        // Modal - Call Ended
        'modal.callEnded.title': 'Call Ended',
        'modal.callEnded.reason': 'Reason',
        'modal.callEnded.duration': 'Duration',
        'modal.callEnded.earnings': 'Earnings',
        'modal.callEnded.endedByYou': 'Ended by you',
        'modal.callEnded.userEnded': 'User ended the call',
        'modal.callEnded.balanceExhausted': 'Balance exhausted',
        'modal.callEnded.unexpectedDisconnection': 'Unexpected disconnection',

        // Modal - Channel Hopping
        'modal.channelHopping.title': 'Access Temporarily Blocked',
        'modal.channelHopping.description1': 'You have changed models too quickly several times in a row.',
        'modal.channelHopping.description2': 'To maintain a quality experience, video chat is temporarily disabled.',
        'modal.channelHopping.timeRemaining': 'Remaining block time',
        'modal.channelHopping.tips': 'Tips',
        'modal.channelHopping.tip1': 'Stay at least 15 seconds with each model',
        'modal.channelHopping.tip2': 'If you stay 1+ minute, the counter resets',
        'modal.channelHopping.tip3': 'You can continue in your current call normally',
        'modal.channelHopping.understood': 'Understood',

        // Modal - No Models
        'modal.noModels.title': 'Models Not Available',
        'modal.noModels.description': 'Sorry, there are currently no models available to start a connection.',
        'modal.noModels.instruction': 'Please try again later. We are working to ensure you always have options.',

        // Modal - Permission Denied
        'modal.permissionDenied.title': 'Permissions Denied',
        'modal.permissionDenied.description': 'We could not access your camera or microphone. To continue, we need you to grant the necessary permissions.',
        'modal.permissionDenied.solutionsTitle': 'Possible solutions',
        'modal.permissionDenied.solution1': 'Make sure you have accepted the permissions in your browser\'s popup window.',
        'modal.permissionDenied.solution2': 'Check your browser and operating system privacy settings.',
        'modal.permissionDenied.solution3': 'Make sure your devices (camera/microphone) are connected and not being used by another application.',
    },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguageState] = useState<Language>('es');

    // Load language from localStorage on mount
    useEffect(() => {
        const savedLanguage = localStorage.getItem('language') as Language;
        if (savedLanguage && (savedLanguage === 'es' || savedLanguage === 'en')) {
            setLanguageState(savedLanguage);
        }
    }, []);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem('language', lang);
    };

    const t = (key: string): string => {
        return translations[language][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
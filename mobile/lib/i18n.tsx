import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLocales } from "expo-localization";

export type Lang = "en" | "es";

const STORAGE_KEY = "rekalla:lang";

type Dict = Record<string, string>;

// ---------------------------------------------------------------------------
// Strings. Keys are grouped by area with dot notation. English is the source
// of truth; any key missing from Spanish falls back to English.
// ---------------------------------------------------------------------------

const en: Dict = {
  // generic
  "common.loading": "Loading…",
  "common.cancel": "Cancel",
  "common.save": "Save",
  "common.done": "Done",
  "common.snooze": "Snooze",
  "common.undo": "Undo",
  "common.signOut": "Sign out",
  "common.edit": "Edit",
  "common.optional": "optional",
  "common.back": "Back",

  // auth
  "auth.wordmark": "Rekalla",
  "auth.signUp.title": "Create your account",
  "auth.signUp.subtitle": "A few details and you're all set.",
  "auth.signUp.who": "Who is this account for?",
  "auth.signUp.patient": "Loved One",
  "auth.signUp.patientDetail": "For an aging loved one who's a little forgetful.",
  "auth.signUp.caregiver": "Caregiver",
  "auth.signUp.caregiverDetail": "I set up reminders for someone I care for.",
  "auth.signUp.manageQ": "Who will manage the reminders?",
  "auth.signUp.self": "I'll manage myself",
  "auth.signUp.selfDetail": "You add and edit your own reminders, routine, and memory bank.",
  "auth.signUp.helped": "A family caregiver will help",
  "auth.signUp.helpedDetail": "A family member sets things up for you using a connect code.",
  "auth.field.name": "Your name",
  "auth.field.namePlaceholder": "Rose Alvarez",
  "auth.field.email": "Email address",
  "auth.field.emailPlaceholder": "you@example.com",
  "auth.field.password": "Password",
  "auth.field.passwordPlaceholder": "At least 8 characters",
  "auth.signUp.button": "Create account",
  "auth.signUp.haveAccount": "Already have an account?",
  "auth.signUp.logIn": "Log in",
  "auth.err.name": "Please enter your name.",
  "auth.err.email": "Please enter a valid email.",
  "auth.err.password": "Your password needs at least 8 characters.",
  "auth.err.confirm": "Check your email for a confirmation link, then log in.",

  // email verification (6-digit code)
  "auth.verify.title": "Check your email",
  "auth.verify.subtitle":
    "We sent a 6-digit code to {email}. Enter it below to finish setting up your account.",
  "auth.verify.code": "6-digit code",
  "auth.verify.codePlaceholder": "123456",
  "auth.verify.button": "Verify and continue",
  "auth.verify.resend": "Send a new code",
  "auth.verify.resendIn": "You can ask for a new code in {seconds}s",
  "auth.verify.resent": "Sent. Check your email again.",
  "auth.verify.err.code": "Please enter the 6-digit code from your email.",
  "auth.verify.err.invalid":
    "That code didn't work. Check it and try again, or ask for a new one.",
  "auth.verify.backToSignUp": "Wrong email? Go back and sign up again.",
  "auth.signIn.unverified":
    "Your email isn't verified yet. Enter the code we just sent you.",
  "auth.signIn.title": "Welcome back",
  "auth.signIn.subtitle": "Log in to see what's on your schedule today.",
  "auth.signIn.passwordPlaceholder": "Your password",
  "auth.signIn.button": "Log in",
  "auth.signIn.forgot": "Forgot your password?",
  "auth.signIn.noAccount": "New to Rekalla?",
  "auth.signIn.create": "Create an account",
  "auth.signIn.badCredentials":
    "That email and password don't match. Please try again.",
  "auth.forgot.title": "Reset your password",
  "auth.forgot.subtitle":
    "Enter your email and we'll send you a link to set a new password.",
  "auth.forgot.button": "Send reset link",
  "auth.forgot.back": "Back to log in",
  "auth.forgot.needEmail": "Please enter your email address.",
  "auth.forgot.sent":
    "If an account exists for {email}, we've sent a link to reset your password. Open the email on this phone and follow the link, then come back and log in.",

  // tab bar
  "tab.summary": "Summary",
  "tab.reminders": "Reminders",
  "tab.routine": "Routine",
  "tab.vault": "Vault",
  "tab.wellness": "Wellness",
  "tab.people": "People",
  "tab.account": "Account",

  // summary
  "summary.greeting.morning": "Good morning",
  "summary.greeting.afternoon": "Good afternoon",
  "summary.greeting.evening": "Good evening",
  "summary.ring.reminders": "Reminders",
  "summary.ring.routine": "Routine",
  "summary.ring.checkin": "Check-in",
  "summary.ring.none": "None today",
  "summary.ring.notSet": "Not set up",
  "summary.ring.checkinDone": "Done",
  "summary.ring.checkinNot": "Not yet",
  "summary.ofCount": "{done} of {total}",
  "summary.upNext": "Up next",
  "summary.noneToday": "No reminders scheduled for today.",
  "summary.allCaught": "All caught up — nothing waiting on you.",

  // reminders (patient)
  "reminders.subtitle": "Check things off as you go.",
  "reminders.empty": "Nothing scheduled today. Reminders will show up here.",
  "reminders.stillWaiting": "Still waiting",
  "reminders.snoozedUntil": "Snoozed until {time}",

  // routine (patient)
  "routine.subtitle": "Check off each step as your day goes on.",
  "routine.empty":
    "No routine set up yet. Steps will appear here once they're added.",
  "routine.morning": "Morning",
  "routine.afternoon": "Afternoon",
  "routine.evening": "Evening",
  "routine.around": "around {time}",

  // vault (patient)
  "vault.subtitle": "People, doctors, and important details.",
  "vault.search": "Search names, medications, notes…",
  "vault.noMatch": "Nothing matches that search.",
  "vault.empty":
    "Nothing added yet. People, doctors, and important details will appear here.",

  // wellness
  "wellness.subtitle": "A quick daily check-in.",
  "wellness.mood": "How are you feeling today?",
  "wellness.mood1": "Very low",
  "wellness.mood2": "Low",
  "wellness.mood3": "Okay",
  "wellness.mood4": "Good",
  "wellness.mood5": "Great",
  "wellness.sleep": "How did you sleep last night?",
  "wellness.hours": "{n} hours",
  "wellness.energy": "How is your energy?",
  "wellness.save": "Save today's check-in",
  "wellness.update": "Update today's check-in",
  "wellness.saved": "Saved. Have a lovely day!",
  "wellness.recent": "Recent days",
  "wellness.hSleep": "{n}h sleep",
  "wellness.energyOf": "energy {n}/5",

  // connect (patient)
  "connect.subtitle":
    "Share your code so a family member can help set up your reminders.",
  "connect.yourCode": "Your connect code",
  "connect.codeHelp":
    "Give this code to the person who cares for you. They'll type it into their own Rekalla account to connect.",
  "connect.caregivers": "Connected caregivers",
  "connect.none": "No caregivers yet. Share your code above to connect one.",
  "connect.pendingTitle": "Caregiver request",
  "connect.pendingBody": "{name} wants to connect as your caregiver. They'll be able to help manage your reminders, routine, and memory bank.",
  "connect.approve": "Approve",
  "connect.decline": "Decline",
  "connect.remove": "Remove",
  "connect.removeTitle": "Remove this caregiver?",
  "connect.removeBody":
    "They will no longer see or manage your reminders, routine, or memory bank.",
  "connect.removeConfirm": "Remove caregiver",
  "connect.removeFailed": "That didn't work. Please try again.",

  // caregiver people
  "people.subtitle": "Everyone you help care for, in one place.",
  "people.connectTitle": "Connect to someone",
  "people.connectBody":
    "Ask the person you care for to open Rekalla and read you their connect code, then type it in here.",
  "people.codePlaceholder": "e.g. R7K2QX",
  "people.connect": "Connect",
  "people.connected": "Connected to {name}.",
  "people.requestSent": "Request sent to {name}. They'll need to approve it before you can help.",
  "people.mine": "People I care for",
  "people.empty":
    "No one connected yet. Enter a connect code above and they'll appear here.",
  "people.rowMeta": "Reminders, routine & memory bank",

  // manager (patient/[id])
  "mgr.tab.reminders": "Reminders",
  "mgr.tab.routine": "Routine",
  "mgr.tab.vault": "Memory",
  "mgr.rem.summary": "{done} of {total} reminders done today.",
  "mgr.rem.none": "No reminders scheduled today.",
  "mgr.rem.add": "Add reminder for {name}",
  "mgr.rem.editing": "Editing reminder",
  "mgr.rem.q1": "What should we remind {name} about?",
  "mgr.rem.q1Placeholder": "e.g. Take morning medication",
  "mgr.rem.category": "Category",
  "mgr.rem.time": "At what time? (24-hour, like 08:00)",
  "mgr.rem.freq": "How often?",
  "mgr.rem.addBtn": "Add reminder",
  "mgr.rem.saveBtn": "Save changes",
  "mgr.rem.today": "Today",
  "mgr.rem.nothingToday": "Nothing scheduled for {name} today.",
  "mgr.rem.all": "All reminders",
  "mgr.rem.allEmpty": "No reminders yet — add the first one above.",
  "cat.medication": "Medication",
  "cat.meals": "Meals",
  "cat.appointments": "Appointments",
  "cat.exercise": "Exercise",
  "cat.family_calls": "Family calls",
  "cat.custom": "Personal",
  "freq.daily": "Every day",
  "freq.once": "Just once",
  "freq.weekly": "Weekly",
  "mgr.rt.summary": "Steps for {name}'s day — they check these off themselves.",
  "mgr.rt.add": "Add a routine step for {name}",
  "mgr.rt.editing": "Editing step",
  "mgr.rt.q1": "What's the step?",
  "mgr.rt.q1Placeholder": "e.g. Brush teeth",
  "mgr.rt.period": "Time of day",
  "mgr.rt.time": "Around what time? (optional, like 08:00)",
  "mgr.rt.timePlaceholder": "Leave blank if it doesn't matter",
  "mgr.rt.addBtn": "Add step",
  "mgr.rt.empty": "No routine yet — add {name}'s first step above.",
  "mgr.rt.anyTime": "any time",
  "mgr.vt.summary": "People, doctors, and details {name} can look up any time.",
  "mgr.vt.add": "Add to {name}'s memory bank",
  "mgr.vt.editing": "Editing entry",
  "mgr.vt.kind": "What kind of thing is this?",
  "mgr.vt.name": "Name",
  "mgr.vt.namePlaceholder": "e.g. Dr. Alvarez, or Sarah (daughter)",
  "mgr.vt.desc": "Short description (optional)",
  "mgr.vt.descPlaceholder": "e.g. Primary care doctor",
  "mgr.vt.phone": "Phone number (optional)",
  "mgr.vt.phonePlaceholder": "e.g. (555) 123-4567",
  "mgr.vt.notes": "Notes (optional)",
  "mgr.vt.notesPlaceholder": "Anything helpful to remember",
  "mgr.vt.photo": "Photo (optional)",
  "mgr.vt.addPhoto": "Add a photo",
  "mgr.vt.changePhoto": "Choose a different photo",
  "mgr.vt.removePhoto": "Remove photo",
  "mgr.vt.saveBtn": "Save to memory bank",
  "mgr.vt.empty": "Nothing saved yet — add the first person or detail above.",
  "mgr.vt.photoErr":
    "The photo didn't upload. Check your connection and try again, or remove the photo.",
  "vcat.family": "Family",
  "vcat.contact": "Contact",
  "vcat.doctor": "Doctor",
  "vcat.medication": "Medication",
  "vcat.important_date": "Important date",
  "vcat.emergency": "Emergency",
  "vcat.note": "Note",
  "mgr.err.name": "Please give the reminder a name.",
  "mgr.err.time": "Time must look like 08:00 or 19:30.",
  "mgr.err.stepName": "Please name this step.",
  "mgr.err.timeOptional": "Time must look like 08:00, or leave it blank.",
  "mgr.err.vaultName": "Please give this a name.",

  // settings
  "settings.you": "You",
  "settings.caregiver": "Caregiver",
  "settings.yourName": "Your name",
  "settings.saveName": "Save name",
  "settings.nameNeeded": "Please enter a name.",
  "settings.language": "Language",
  "settings.english": "English",
  "settings.spanish": "Español",
  "settings.legal": "Legal",
  "settings.terms": "Terms of Use",
  "settings.privacy": "Privacy Policy",
  "settings.selfManageTitle": "Manage my own reminders",
  "settings.selfManageBody":
    "Turn this on to add and edit your own reminders, routine, and memory bank.",
  "selfManage.reminders": "Add or edit my reminders",
  "selfManage.routine": "Add or edit my routine",
  "selfManage.vault": "Add or edit my memory bank",
  "delete.open": "Delete my account",
  "delete.title": "Delete this account?",
  "delete.body":
    "This permanently erases your account and everything in it — reminders, routine, memory bank, wellness history, and caregiver connections. It cannot be undone.",
  "delete.confirmPrompt": "To continue, type DELETE below.",
  "delete.placeholder": "Type DELETE",
  "delete.button": "Permanently delete my account",
  "delete.keep": "Keep my account",
  "delete.error":
    "We couldn't delete your account just now. Please try again, or contact us if it keeps happening.",

  // terms
  "terms.header": "Before you begin",
  "terms.sub": "Please review and accept our Terms of Use and Privacy Policy.",
  "terms.scrollHint": "Scroll to the bottom to continue.",
  "terms.thanks": "Thanks for reading.",
  "terms.accept": "Accept & continue",
  "terms.scrollDown": "Scroll down to accept",

  // welcome tour
  "tour.skip": "Skip",
  "tour.next": "Next",
  "tour.start": "Get started",
  "tour.p1.title": "Welcome to Rekalla",
  "tour.p1.body":
    "A calm, simple place to keep track of your day — reminders, a daily routine, and the people who matter.",
  "tour.p2.title": "Your day at a glance",
  "tour.p2.body":
    "The Summary screen shows what's coming up and how your day is going. Tap Done on a reminder once you've handled it.",
  "tour.p3.title": "Let family help",
  "tour.p3.body":
    "Tap the heart icon at the top to see your connect code. Share it with a family member so they can help set things up for you.",
  "tour.c1.title": "Welcome to Rekalla",
  "tour.c1.body":
    "Help someone you care for stay on top of their day — right from your own phone.",
  "tour.c2.title": "Connect with a code",
  "tour.c2.body":
    "Ask your loved one to open Rekalla and read you their 6-letter connect code. Enter it on the People screen — no shared passwords.",
  "tour.c3.title": "Set up their day",
  "tour.c3.body":
    "Add reminders, build a daily routine, and fill their Memory Vault with people and photos. It appears on their phone instantly.",

  // schedule descriptions
  "sched.everyDay": "Every day at {time}",
  "sched.every": "Every {days} at {time}",
  "sched.monthly": "Monthly on day {day} at {time}",
  "sched.onDate": "{date} at {time}",

  // notification bodies
  "notif.medication": "Time for your medication.",
  "notif.meals": "Time to eat.",
  "notif.appointments": "You have an appointment.",
  "notif.exercise": "Time to move a little.",
  "notif.family_calls": "Time to make a call.",
  "notif.custom": "Here's your reminder.",
};

const es: Dict = {
  "common.loading": "Cargando…",
  "common.cancel": "Cancelar",
  "common.save": "Guardar",
  "common.done": "Hecho",
  "common.snooze": "Posponer",
  "common.undo": "Deshacer",
  "common.signOut": "Cerrar sesión",
  "common.edit": "Editar",
  "common.optional": "opcional",
  "common.back": "Atrás",

  "auth.wordmark": "Rekalla",
  "auth.signUp.title": "Crea tu cuenta",
  "auth.signUp.subtitle": "Unos datos y estarás listo.",
  "auth.signUp.who": "¿Para quién es esta cuenta?",
  "auth.signUp.patient": "Ser querido",
  "auth.signUp.patientDetail": "Para un ser querido mayor que es un poco olvidadizo.",
  "auth.signUp.caregiver": "Cuidador",
  "auth.signUp.caregiverDetail":
    "Yo configuro recordatorios para alguien a quien cuido.",
  "auth.signUp.manageQ": "¿Quién administrará los recordatorios?",
  "auth.signUp.self": "Yo me encargo",
  "auth.signUp.selfDetail":
    "Tú agregas y editas tus propios recordatorios, rutina y recuerdos.",
  "auth.signUp.helped": "Un cuidador familiar ayudará",
  "auth.signUp.helpedDetail":
    "Un familiar lo configura por ti usando un código de conexión.",
  "auth.field.name": "Tu nombre",
  "auth.field.namePlaceholder": "Rosa Álvarez",
  "auth.field.email": "Correo electrónico",
  "auth.field.emailPlaceholder": "tu@ejemplo.com",
  "auth.field.password": "Contraseña",
  "auth.field.passwordPlaceholder": "Al menos 8 caracteres",
  "auth.signUp.button": "Crear cuenta",
  "auth.signUp.haveAccount": "¿Ya tienes una cuenta?",
  "auth.signUp.logIn": "Inicia sesión",
  "auth.err.name": "Por favor, escribe tu nombre.",
  "auth.err.email": "Por favor, escribe un correo válido.",
  "auth.err.password": "Tu contraseña necesita al menos 8 caracteres.",
  "auth.err.confirm":
    "Revisa tu correo para el enlace de confirmación y luego inicia sesión.",

  "auth.verify.title": "Revisa tu correo",
  "auth.verify.subtitle":
    "Enviamos un código de 6 dígitos a {email}. Escríbelo abajo para terminar de crear tu cuenta.",
  "auth.verify.code": "Código de 6 dígitos",
  "auth.verify.codePlaceholder": "123456",
  "auth.verify.button": "Verificar y continuar",
  "auth.verify.resend": "Enviar un código nuevo",
  "auth.verify.resendIn": "Puedes pedir un código nuevo en {seconds}s",
  "auth.verify.resent": "Enviado. Revisa tu correo otra vez.",
  "auth.verify.err.code": "Por favor, escribe el código de 6 dígitos de tu correo.",
  "auth.verify.err.invalid":
    "Ese código no funcionó. Revísalo e inténtalo de nuevo, o pide uno nuevo.",
  "auth.verify.backToSignUp": "¿Correo equivocado? Vuelve y crea la cuenta otra vez.",
  "auth.signIn.unverified":
    "Tu correo aún no está verificado. Escribe el código que acabamos de enviarte.",
  "auth.signIn.title": "Bienvenido de nuevo",
  "auth.signIn.subtitle": "Inicia sesión para ver tu día de hoy.",
  "auth.signIn.passwordPlaceholder": "Tu contraseña",
  "auth.signIn.button": "Iniciar sesión",
  "auth.signIn.forgot": "¿Olvidaste tu contraseña?",
  "auth.signIn.noAccount": "¿Nuevo en Rekalla?",
  "auth.signIn.create": "Crear una cuenta",
  "auth.signIn.badCredentials":
    "Ese correo y contraseña no coinciden. Inténtalo de nuevo.",
  "auth.forgot.title": "Restablecer tu contraseña",
  "auth.forgot.subtitle":
    "Escribe tu correo y te enviaremos un enlace para crear una nueva contraseña.",
  "auth.forgot.button": "Enviar enlace",
  "auth.forgot.back": "Volver a iniciar sesión",
  "auth.forgot.needEmail": "Por favor, escribe tu correo electrónico.",
  "auth.forgot.sent":
    "Si existe una cuenta para {email}, te hemos enviado un enlace para restablecer tu contraseña. Abre el correo en este teléfono y sigue el enlace, luego vuelve e inicia sesión.",

  "tab.summary": "Resumen",
  "tab.reminders": "Recordatorios",
  "tab.routine": "Rutina",
  "tab.vault": "Recuerdos",
  "tab.wellness": "Bienestar",
  "tab.people": "Personas",
  "tab.account": "Cuenta",

  "summary.greeting.morning": "Buenos días",
  "summary.greeting.afternoon": "Buenas tardes",
  "summary.greeting.evening": "Buenas noches",
  "summary.ring.reminders": "Recordatorios",
  "summary.ring.routine": "Rutina",
  "summary.ring.checkin": "Registro",
  "summary.ring.none": "Nada hoy",
  "summary.ring.notSet": "Sin configurar",
  "summary.ring.checkinDone": "Hecho",
  "summary.ring.checkinNot": "Aún no",
  "summary.ofCount": "{done} de {total}",
  "summary.upNext": "A continuación",
  "summary.noneToday": "No hay recordatorios para hoy.",
  "summary.allCaught": "Todo al día — nada pendiente.",

  "reminders.subtitle": "Marca las cosas a medida que avanzas.",
  "reminders.empty":
    "Nada programado hoy. Los recordatorios aparecerán aquí.",
  "reminders.stillWaiting": "Aún pendiente",
  "reminders.snoozedUntil": "Pospuesto hasta {time}",

  "routine.subtitle": "Marca cada paso a medida que avanza tu día.",
  "routine.empty":
    "Aún no hay una rutina configurada. Los pasos aparecerán aquí cuando se añadan.",
  "routine.morning": "Mañana",
  "routine.afternoon": "Tarde",
  "routine.evening": "Noche",
  "routine.around": "alrededor de las {time}",

  "vault.subtitle": "Personas, médicos y detalles importantes.",
  "vault.search": "Buscar nombres, medicamentos, notas…",
  "vault.noMatch": "Nada coincide con esa búsqueda.",
  "vault.empty":
    "Aún no se ha añadido nada. Personas, médicos y detalles importantes aparecerán aquí.",

  "wellness.subtitle": "Un registro diario rápido.",
  "wellness.mood": "¿Cómo te sientes hoy?",
  "wellness.mood1": "Muy bajo",
  "wellness.mood2": "Bajo",
  "wellness.mood3": "Regular",
  "wellness.mood4": "Bien",
  "wellness.mood5": "Genial",
  "wellness.sleep": "¿Cómo dormiste anoche?",
  "wellness.hours": "{n} horas",
  "wellness.energy": "¿Cómo está tu energía?",
  "wellness.save": "Guardar el registro de hoy",
  "wellness.update": "Actualizar el registro de hoy",
  "wellness.saved": "Guardado. ¡Que tengas un buen día!",
  "wellness.recent": "Días recientes",
  "wellness.hSleep": "{n}h de sueño",
  "wellness.energyOf": "energía {n}/5",

  "connect.subtitle":
    "Comparte tu código para que un familiar pueda ayudarte a configurar tus recordatorios.",
  "connect.yourCode": "Tu código de conexión",
  "connect.codeHelp":
    "Dale este código a la persona que te cuida. Lo escribirá en su propia cuenta de Rekalla para conectarse.",
  "connect.caregivers": "Cuidadores conectados",
  "connect.none":
    "Aún no hay cuidadores. Comparte tu código de arriba para conectar uno.",
  "connect.pendingTitle": "Solicitud de cuidador",
  "connect.pendingBody": "{name} quiere conectarse como tu cuidador. Podrá ayudarte a administrar tus recordatorios, rutina y recuerdos.",
  "connect.approve": "Aprobar",
  "connect.decline": "Rechazar",
  "connect.remove": "Quitar",
  "connect.removeTitle": "¿Quitar a este cuidador?",
  "connect.removeBody":
    "Ya no podrá ver ni administrar tus recordatorios, rutina ni recuerdos.",
  "connect.removeConfirm": "Quitar cuidador",
  "connect.removeFailed": "No funcionó. Por favor, inténtalo de nuevo.",

  "people.subtitle": "Todas las personas que ayudas a cuidar, en un solo lugar.",
  "people.connectTitle": "Conectar con alguien",
  "people.connectBody":
    "Pídele a la persona que cuidas que abra Rekalla y te lea su código de conexión, luego escríbelo aquí.",
  "people.codePlaceholder": "ej. R7K2QX",
  "people.connect": "Conectar",
  "people.connected": "Conectado con {name}.",
  "people.requestSent": "Solicitud enviada a {name}. Deberá aprobarla antes de que puedas ayudar.",
  "people.mine": "Personas que cuido",
  "people.empty":
    "Aún no hay nadie conectado. Escribe un código de conexión arriba y aparecerán aquí.",
  "people.rowMeta": "Recordatorios, rutina y recuerdos",

  "mgr.tab.reminders": "Recordatorios",
  "mgr.tab.routine": "Rutina",
  "mgr.tab.vault": "Recuerdos",
  "mgr.rem.summary": "{done} de {total} recordatorios hechos hoy.",
  "mgr.rem.none": "No hay recordatorios programados hoy.",
  "mgr.rem.add": "Añadir recordatorio para {name}",
  "mgr.rem.editing": "Editando recordatorio",
  "mgr.rem.q1": "¿De qué debemos recordarle a {name}?",
  "mgr.rem.q1Placeholder": "ej. Tomar el medicamento de la mañana",
  "mgr.rem.category": "Categoría",
  "mgr.rem.time": "¿A qué hora? (24 horas, como 08:00)",
  "mgr.rem.freq": "¿Con qué frecuencia?",
  "mgr.rem.addBtn": "Añadir recordatorio",
  "mgr.rem.saveBtn": "Guardar cambios",
  "mgr.rem.today": "Hoy",
  "mgr.rem.nothingToday": "Nada programado para {name} hoy.",
  "mgr.rem.all": "Todos los recordatorios",
  "mgr.rem.allEmpty": "Aún no hay recordatorios — añade el primero arriba.",
  "cat.medication": "Medicamento",
  "cat.meals": "Comidas",
  "cat.appointments": "Citas",
  "cat.exercise": "Ejercicio",
  "cat.family_calls": "Llamadas familiares",
  "cat.custom": "Personal",
  "freq.daily": "Todos los días",
  "freq.once": "Solo una vez",
  "freq.weekly": "Semanal",
  "mgr.rt.summary":
    "Pasos para el día de {name} — ellos los marcan por sí mismos.",
  "mgr.rt.add": "Añadir un paso de rutina para {name}",
  "mgr.rt.editing": "Editando paso",
  "mgr.rt.q1": "¿Cuál es el paso?",
  "mgr.rt.q1Placeholder": "ej. Cepillarse los dientes",
  "mgr.rt.period": "Momento del día",
  "mgr.rt.time": "¿Alrededor de qué hora? (opcional, como 08:00)",
  "mgr.rt.timePlaceholder": "Déjalo en blanco si no importa",
  "mgr.rt.addBtn": "Añadir paso",
  "mgr.rt.empty": "Aún no hay rutina — añade el primer paso de {name} arriba.",
  "mgr.rt.anyTime": "en cualquier momento",
  "mgr.vt.summary":
    "Personas, médicos y detalles que {name} puede consultar en cualquier momento.",
  "mgr.vt.add": "Añadir a los recuerdos de {name}",
  "mgr.vt.editing": "Editando entrada",
  "mgr.vt.kind": "¿Qué tipo de cosa es esta?",
  "mgr.vt.name": "Nombre",
  "mgr.vt.namePlaceholder": "ej. Dr. Álvarez, o Sara (hija)",
  "mgr.vt.desc": "Descripción breve (opcional)",
  "mgr.vt.descPlaceholder": "ej. Médico de cabecera",
  "mgr.vt.phone": "Número de teléfono (opcional)",
  "mgr.vt.phonePlaceholder": "ej. (555) 123-4567",
  "mgr.vt.notes": "Notas (opcional)",
  "mgr.vt.notesPlaceholder": "Cualquier cosa útil para recordar",
  "mgr.vt.photo": "Foto (opcional)",
  "mgr.vt.addPhoto": "Añadir una foto",
  "mgr.vt.changePhoto": "Elegir otra foto",
  "mgr.vt.removePhoto": "Quitar foto",
  "mgr.vt.saveBtn": "Guardar en recuerdos",
  "mgr.vt.empty":
    "Aún no hay nada guardado — añade la primera persona o detalle arriba.",
  "mgr.vt.photoErr":
    "La foto no se subió. Revisa tu conexión e inténtalo de nuevo, o quita la foto.",
  "vcat.family": "Familia",
  "vcat.contact": "Contacto",
  "vcat.doctor": "Médico",
  "vcat.medication": "Medicamento",
  "vcat.important_date": "Fecha importante",
  "vcat.emergency": "Emergencia",
  "vcat.note": "Nota",
  "mgr.err.name": "Por favor, dale un nombre al recordatorio.",
  "mgr.err.time": "La hora debe verse como 08:00 o 19:30.",
  "mgr.err.stepName": "Por favor, nombra este paso.",
  "mgr.err.timeOptional":
    "La hora debe verse como 08:00, o déjala en blanco.",
  "mgr.err.vaultName": "Por favor, dale un nombre a esto.",

  "settings.you": "Tú",
  "settings.caregiver": "Cuidador",
  "settings.yourName": "Tu nombre",
  "settings.saveName": "Guardar nombre",
  "settings.nameNeeded": "Por favor, escribe un nombre.",
  "settings.legal": "Legal",
  "settings.terms": "Términos de uso",
  "settings.privacy": "Política de privacidad",
  "settings.selfManageTitle": "Administrar mis propios recordatorios",
  "settings.selfManageBody":
    "Actívalo para agregar y editar tus propios recordatorios, rutina y recuerdos.",
  "selfManage.reminders": "Agregar o editar mis recordatorios",
  "selfManage.routine": "Agregar o editar mi rutina",
  "selfManage.vault": "Agregar o editar mis recuerdos",
  "settings.language": "Idioma",
  "settings.english": "English",
  "settings.spanish": "Español",
  "delete.open": "Eliminar mi cuenta",
  "delete.title": "¿Eliminar esta cuenta?",
  "delete.body":
    "Esto borra permanentemente tu cuenta y todo lo que contiene — recordatorios, rutina, recuerdos, historial de bienestar y conexiones con cuidadores. No se puede deshacer.",
  "delete.confirmPrompt": "Para continuar, escribe DELETE abajo.",
  "delete.placeholder": "Escribe DELETE",
  "delete.button": "Eliminar mi cuenta permanentemente",
  "delete.keep": "Conservar mi cuenta",
  "delete.error":
    "No pudimos eliminar tu cuenta en este momento. Inténtalo de nuevo, o contáctanos si sigue ocurriendo.",

  "terms.header": "Antes de empezar",
  "terms.sub":
    "Por favor, revisa y acepta nuestros Términos de Uso y Política de Privacidad.",
  "terms.scrollHint": "Desplázate hasta el final para continuar.",
  "terms.thanks": "Gracias por leer.",
  "terms.accept": "Aceptar y continuar",
  "terms.scrollDown": "Desplázate para aceptar",

  "tour.skip": "Saltar",
  "tour.next": "Siguiente",
  "tour.start": "Empezar",
  "tour.p1.title": "Bienvenido a Rekalla",
  "tour.p1.body":
    "Un lugar tranquilo y sencillo para organizar tu día — recordatorios, una rutina diaria y las personas que importan.",
  "tour.p2.title": "Tu día de un vistazo",
  "tour.p2.body":
    "La pantalla de Resumen muestra lo que viene y cómo va tu día. Toca Hecho en un recordatorio cuando lo hayas atendido.",
  "tour.p3.title": "Deja que la familia ayude",
  "tour.p3.body":
    "Toca el ícono del corazón arriba para ver tu código de conexión. Compártelo con un familiar para que pueda ayudarte a configurar todo.",
  "tour.c1.title": "Bienvenido a Rekalla",
  "tour.c1.body":
    "Ayuda a alguien a quien cuidas a organizar su día — desde tu propio teléfono.",
  "tour.c2.title": "Conéctate con un código",
  "tour.c2.body":
    "Pídele a tu ser querido que abra Rekalla y te lea su código de conexión de 6 letras. Escríbelo en la pantalla de Personas — sin compartir contraseñas.",
  "tour.c3.title": "Organiza su día",
  "tour.c3.body":
    "Añade recordatorios, crea una rutina diaria y llena sus Recuerdos con personas y fotos. Aparece en su teléfono al instante.",

  "sched.everyDay": "Todos los días a las {time}",
  "sched.every": "Cada {days} a las {time}",
  "sched.monthly": "Mensual el día {day} a las {time}",
  "sched.onDate": "{date} a las {time}",

  "notif.medication": "Hora de tu medicamento.",
  "notif.meals": "Hora de comer.",
  "notif.appointments": "Tienes una cita.",
  "notif.exercise": "Hora de moverte un poco.",
  "notif.family_calls": "Hora de hacer una llamada.",
  "notif.custom": "Aquí está tu recordatorio.",
};

const DICTS: Record<Lang, Dict> = { en, es };

export type TFunc = (key: string, vars?: Record<string, string | number>) => string;

function translate(lang: Lang, key: string, vars?: Record<string, string | number>) {
  let text = DICTS[lang][key] ?? DICTS.en[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }
  return text;
}

function deviceDefault(): Lang {
  try {
    return getLocales()[0]?.languageCode === "es" ? "es" : "en";
  } catch {
    return "en";
  }
}

interface I18nState {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: TFunc;
}

const I18nContext = createContext<I18nState>({
  lang: "en",
  setLang: () => {},
  t: (key) => translate("en", key),
});

export function useI18n() {
  return useContext(I18nContext);
}

/** Convenience: just the translator. */
export function useT(): TFunc {
  return useContext(I18nContext).t;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(deviceDefault());

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === "en" || stored === "es") setLangState(stored);
    });
  }, []);

  function setLang(next: Lang) {
    setLangState(next);
    AsyncStorage.setItem(STORAGE_KEY, next);
  }

  const value = useMemo<I18nState>(
    () => ({
      lang,
      setLang,
      t: (key, vars) => translate(lang, key, vars),
    }),
    [lang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

import type { Messages } from './fr.ts';

export const de = {
	app: {
		name: 'Mate-Moi si tu peux',
		short: 'Mate-Moi'
	},
	common: {
		pts: { one: '{n} Pkt.', other: '{n} Pkt.' },
		quote: '„{text}“',
		vs: 'vs',
		you: '(du)',
		pageNotFound: 'Seite nicht gefunden'
	},
	lang: {
		label: 'Langue / Language / Sprache'
	},
	theme: {
		label: 'Design',
		auto: 'Auto',
		light: 'Hell',
		dark: 'Dunkel'
	},
	nav: {
		week: 'Die Woche',
		kings: 'Die Könige',
		admin: 'Admin',
		profile: 'Mein Profil',
		logoutTitle: 'Abmelden',
		logout: 'abmelden'
	},
	phase: {
		group: 'Gruppenphase',
		playoff: 'Stechen',
		final: 'Finale',
		done: 'Gekrönt',
		abandoned: 'Abgesagt'
	},
	stage: {
		group: 'Gruppe',
		playoff: 'Stechen',
		final: 'Finale'
	},
	player: {
		deleted: 'Gelöschter Spieler'
	},
	table: {
		player: 'Spieler',
		played: 'Sp',
		playedTitle: 'Gespielte Partien',
		wins: 'S',
		winsTitle: 'Siege',
		draws: 'U',
		drawsTitle: 'Unentschieden',
		losses: 'N',
		lossesTitle: 'Niederlagen',
		points: 'Pkt'
	},
	game: {
		round: 'Runde {n}',
		game: 'Partie {n}',
		white: 'Weiß',
		black: 'Schwarz',
		declared: 'Gemeldet:',
		waitingFor: 'wartet auf {name}',
		dispute: 'Anfechten',
		confirm: 'Bestätigen',
		draw: 'Remis',
		wins: '{name} gewinnt',
		whoWon: 'Wer hat gewonnen?',
		whoWonArmageddon: 'Wer hat gewonnen? Remis zählt als Sieg für Schwarz.',
		autoIn: 'Wird in {n} Std. automatisch bestätigt',
		autoSoon: 'Wird in weniger als einer Stunde automatisch bestätigt',
		autoConfirmed: 'automatisch bestätigt',
		notPlayed: 'nicht gespielt'
	},
	week: {
		label: 'Woche {n}',
		welcome: 'Willkommen, {name}.',
		benched:
			'Die Gruppenphase dieser Woche ist schon vorbei: Du steigst nächste Woche ein. Bis dahin kannst du das Finale verfolgen.',
		joined: {
			one: 'Du steigst in die laufende Woche ein: Deine Partie wartet unter „Du bist dran“.',
			other: 'Du steigst in die laufende Woche ein: Deine {n} Partien warten unter „Du bist dran“.'
		},
		emptyThrone: 'Der Thron ist leer.',
		rules:
			'Jeder gegen jeden (3 Partien pro Gegner bis 4 Spieler, 2 bis 6, danach 1), dann ein Finale der beiden Besten.',
		start: 'Woche {n} starten',
		progress: { one: '{played} / {n} Partie', other: '{played} / {n} Partien' },
		perOpponent: '{n} pro Gegner',
		king: 'König der Woche {n}',
		tie: 'Gleichstand.',
		playoff: '{names} machen es im Armageddon aus (Remis zählt für Schwarz).',
		forTheCrown: 'Um die Krone',
		share: 'Teilen',
		shareWhatsapp: 'Auf WhatsApp teilen',
		yourMove: 'Du bist dran',
		knockout: 'Stechen und Finale',
		shareKing: '♔ {name} ist König der Woche {n}! Wer traut sich, den Thron zu stürmen?',
		abandoned: 'Diese Woche sind nicht mehr genug Spieler übrig: kein König. Nächste Woche geht’s weiter.',
		deadline: 'Frist: {when}',
		today: 'heute',
		tomorrow: 'morgen',
		inDays: 'in {n} T.'
	},
	nudge: {
		button: 'Anstupsen',
		head: '⏰ Weiter geht’s! {week} · {phase}',
		toPlay: 'Noch zu spielen:',
		toConfirm: 'Noch zu bestätigen:',
		mustConfirm: '{name} muss {game} bestätigen',
		nothing: 'Alles gespielt, nur noch bestätigen.',
		before: '⏳ Bis {when}'
	},
	kings: {
		title: 'Die Könige',
		none: 'Noch kein König gekrönt.',
		crowns: { one: '{n} Krone', other: '{n} Kronen' },
		allTime: 'Gesamttabelle · Gruppenphase',
		noGames: 'Noch keine bestätigte Partie.',
		headToHead: 'Direktvergleich · S-U-N, alle Phasen'
	},
	login: {
		title: 'Anmelden',
		heading: 'Wer spielt?',
		intro: 'Wähl deinen Namen und gib deinen Code ein.',
		noPlayers: 'Noch keine Spieler. Füg sie hinzu mit',
		code: 'Code',
		submit: 'Los geht’s',
		chooseName: 'Wähl deinen Namen.',
		wrongCode: 'Falscher Code.',
		locked: 'Zu viele Versuche. Probier es in {min} Min. noch mal.',
		bye: 'Konto gelöscht. Danke für die Partien ♔'
	},
	code: {
		title: 'Mein Code',
		choose: 'Wähl deinen Code',
		forcedIntro: 'Der Code, den du bekommen hast, ist nur vorläufig. Wähl deinen eigenen: Niemand sonst kennt ihn dann.',
		intro: 'Ändere deinen Code, wann du willst. Deine anderen Geräte werden abgemeldet.',
		done: 'Code geändert. Deine anderen Geräte sind abgemeldet.',
		temporary: 'Vorläufiger Code',
		current: 'Aktueller Code',
		next: 'Neuer Code · 6 bis 8 Ziffern',
		again: 'Noch einmal',
		save: 'Speichern',
		notMe: 'Das bin nicht ich · abmelden',
		forgot: 'Code vergessen? Frag den Admin nach einem vorläufigen Code.',
		wrongCurrent: 'Der aktuelle Code ist falsch.',
		mismatch: 'Die beiden neuen Codes stimmen nicht überein.',
		same: 'Wähl einen anderen Code als den aktuellen.'
	},
	pin: {
		length: 'Der Code muss 6 bis 8 Ziffern haben.',
		repeated: 'Zu einfach: immer dieselbe Ziffer.',
		run: 'Zu einfach: eine Zahlenfolge.'
	},
	invite: {
		title: 'Einladung',
		ogTitle: '♔ Du bist zu Mate-Moi si tu peux eingeladen',
		ogDescription: 'Das wöchentliche Schachturnier unter Freunden. Wähl deinen Namen und deinen Code.',
		heading: 'Willkommen am Hof',
		signedIn: 'Du bist schon angemeldet. Diese Einladung ist für einen neuen Spieler: Gib den Link weiter.',
		back: 'Zurück zur Woche',
		invalid: 'Diese Einladung ist abgelaufen oder wurde schon benutzt. Frag einen Admin nach einem neuen Link.',
		intro:
			'Jeder gegen jeden, ein Finale, ein König pro Woche. Läuft die Gruppenphase dieser Woche noch, steigst du sofort ein.',
		name: 'Dein Name (so sehen ihn die anderen)',
		pin: 'Dein Code · 6 bis 8 Ziffern',
		again: 'Noch einmal',
		join: 'Der Liga beitreten',
		alreadySignedIn: 'Du bist schon angemeldet: Diese Einladung ist für einen neuen Spieler.',
		mismatch: 'Die beiden Codes stimmen nicht überein.',
		expired: 'Diese Einladung ist abgelaufen oder wurde schon benutzt.'
	},
	profile: {
		title: 'Mein Profil',
		nameSaved: 'Name geändert.',
		sloganSaved: 'Motto gespeichert.',
		sloganRemoved: 'Motto entfernt.',
		name: 'Mein Name',
		nameHint: 'Er ändert sich überall, auch im Verlauf.',
		changeName: 'Namen ändern',
		slogan: 'Mein Motto',
		sloganPlaceholder: 'Ich setze matt, also bin ich.',
		sloganHint: 'Erscheint, wenn du gekrönt wirst, und in der WhatsApp-Vorschau. Leer lassen zum Entfernen.',
		saveSlogan: 'Motto speichern',
		changeCode: 'Code ändern',
		badName: 'Dein Name: 2 bis 24 Buchstaben (Leerzeichen, Bindestriche und Apostrophe erlaubt).',
		nameTaken: 'Den Namen gibt es schon. Vielleicht mit Initiale?',
		sloganTooLong: 'Dein Motto: höchstens {max} Zeichen.',
		sloganLink: 'Keine Links im Motto.',
		deleteTitle: 'Mein Konto löschen',
		deleteIntro:
			'Dein Name, dein Code und dein Motto werden endgültig gelöscht. Deine Partien bleiben im Verlauf, als „Gelöschter Spieler“.',
		deleteWeek:
			'Spielst du in der laufenden Woche mit, bist du raus: in der Gruppenphase werden deine Partien entfernt, im Stechen oder Finale verlierst du deine kampflos.',
		deleteCode: 'Dein Code, zur Bestätigung',
		deleteConfirm: 'Endgültig löschen',
		lastAdmin: 'Du bist der letzte Admin. Mach zuerst jemand anderen zum Admin.',
		owner: 'Dir gehört die Liga: Übergib sie zuerst an einen anderen Admin (Tab Admin).'
	},
	admin: {
		title: 'Admin',
		inviteMessage:
			'♔ Du bist eingeladen, bei „Mate-Moi si tu peux“ mitzuspielen, unserem wöchentlichen Schachturnier.\nWähl hier deinen Namen und deinen Code (Link 48 Std. gültig, nur einmal nutzbar):\n{link}',
		invitePlayer: 'Spieler einladen',
		linkReady: 'Link bereit. Er funktioniert einmal, 48 Std. lang:',
		copied: 'Kopiert ✓',
		copy: 'Kopieren',
		send: 'Senden',
		joinRule:
			'Während der Gruppenphase steigt er in die laufende Woche ein: Seine Partien gegen alle kommen dazu. Danach fängt er in der nächsten Woche an.',
		createInvite: 'Einladungslink erstellen',
		inviteBy: 'Link von {by} · gültig bis {when}',
		revoke: 'Widerrufen',
		players: 'Spieler',
		tempPinFor: 'Vorläufiger Code für {name}:',
		tempPinHint: 'Schick ihn privat: Beim Anmelden wählt er seinen eigenen. Er wird nicht noch einmal angezeigt.',
		badgeAdmin: 'Admin',
		badgeArchived: 'Archiviert',
		badgeTempPin: 'Vorläufiger Code',
		badgeLocked: 'Gesperrt',
		resetPin: 'Code zurücksetzen',
		archive: 'Archivieren',
		unarchive: 'Zurückholen',
		demote: 'Admin entziehen',
		promote: 'Zum Admin machen',
		archiveHint:
			'Archivieren: Der Spieler wird abgemeldet, verschwindet aus der Anmeldung und ist aus der laufenden Woche raus; sein Verlauf bleibt, und du kannst ihn zurückholen. Löschen: Name und Code sind endgültig weg, seine Partien bleiben als „Gelöschter Spieler“.',
		delete: 'Löschen',
		deleteTitle: '{name} löschen?',
		deleteIntro:
			'Name, Code und Motto werden endgültig gelöscht; die Partien bleiben, als „Gelöschter Spieler“. Tipp zur Bestätigung den Namen ein.',
		deleteName: 'Der Name, genau so',
		deleteConfirm: 'Endgültig löschen',
		deleteNameMismatch: 'Der Name stimmt nicht.',
		deleted: '{name} ist gelöscht.',
		backup: 'Backup',
		download: 'Ganze Liga herunterladen (.db)',
		backupHint:
			'Eine Datei: Spieler, Partien, Könige. Privat aufbewahren. Wiederherstellen oder Server wechseln: siehe README.',
		playerNotFound: 'Spieler nicht gefunden.',
		notYourself: 'Nicht bei deinem eigenen Konto.',
		badgeOwner: 'Eigentümer',
		ownerProtected: 'Dem Eigentümer der Liga kann man weder die Admin-Rechte entziehen noch ihn archivieren oder löschen.',
		ownerOnly: 'Nur der Eigentümer kann die Liga übergeben.',
		transferToAdmin: 'Die Liga kann nur an einen anderen aktiven Admin übergeben werden.',
		transfer: 'Liga übergeben',
		transferTitle: '{name} zum Eigentümer machen?',
		transferIntro:
			'Du bleibst Admin, aber {name} wird unantastbar: keine Admin-Rechte entziehen, nicht archivieren, nicht löschen. Tipp zur Bestätigung den Namen ein.',
		transferConfirm: 'Übergeben',
		transferred: '{name} ist jetzt Eigentümer der Liga.',
		week: 'Laufende Woche',
		deadline: 'Frist der Gruppenphase',
		deadlineSave: 'Frist ändern',
		deadlineHint:
			'Bei Fristende zählen offene Ergebnisse wie gemeldet, und ungespielte Partien enden 0 – 0 (für beide verloren, keine Punkte). Danach Stechen oder Finale, ohne Frist.',
		deadlineSaved: 'Neue Frist: {when}.'
	},
	league: {
		weekNotOver: 'Die laufende Woche ist noch nicht vorbei.',
		needTwoPlayers: 'Es braucht mindestens zwei Spieler.',
		gameNotFound: 'Partie nicht gefunden.',
		weekOver: 'Diese Woche ist vorbei.',
		alreadyConfirmed: 'Dieses Ergebnis ist schon bestätigt.',
		armageddonDraw: 'Im Armageddon zählt Remis als Sieg für Schwarz.',
		nothingToConfirm: 'Kein Ergebnis zu bestätigen.',
		opponentConfirms: 'Dein Gegner muss bestätigen.',
		nothingToDispute: 'Kein Ergebnis zum Anfechten.',
		unknownResult: 'Unbekanntes Ergebnis.',
		badDeadline: 'Ungültiges Datum.',
		deadlinePast: 'Die Frist muss in der Zukunft liegen.',
		noOpenWeek: 'Gerade läuft keine Woche.',
		groupOver: 'Die Gruppenphase ist vorbei: keine Frist mehr.'
	},
	preview: {
		kingTitle: '♔ {name} ist König der Woche {n}',
		tagline: 'Das wöchentliche Schachturnier.',
		open: 'Mate-Moi öffnen…',
		progress: { one: '{played}/{n} Partie', other: '{played}/{n} Partien' },
		record: '{w}S {d}U {l}N'
	}
} satisfies Messages;

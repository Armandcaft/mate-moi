// French: the source of truth. `en.ts` and `de.ts` must have exactly these keys (a type error otherwise).
// `{name}` is a parameter; an object `{ one, other }` is a plural, chosen by the `n` parameter.

export const fr = {
	app: {
		name: 'Mate-Moi si tu peux',
		short: 'Mate-Moi'
	},
	common: {
		pts: { one: '{n} pt', other: '{n} pts' },
		quote: '« {text} »',
		vs: 'vs',
		you: '(toi)',
		pageNotFound: 'Page introuvable'
	},
	lang: {
		label: 'Langue / Language / Sprache'
	},
	theme: {
		label: 'Thème',
		auto: 'Auto',
		light: 'Clair',
		dark: 'Sombre'
	},
	nav: {
		week: 'La semaine',
		kings: 'Les Rois',
		admin: 'Admin',
		profile: 'Mon profil',
		logoutTitle: 'Se déconnecter',
		logout: 'sortir'
	},
	phase: {
		group: 'Phase de groupes',
		playoff: 'Barrage',
		final: 'Finale',
		done: 'Couronné',
		abandoned: 'Semaine annulée'
	},
	stage: {
		group: 'Groupe',
		playoff: 'Barrage',
		final: 'Finale'
	},
	player: {
		deleted: 'Joueur supprimé'
	},
	table: {
		player: 'Joueur',
		played: 'J',
		playedTitle: 'Parties jouées',
		wins: 'V',
		winsTitle: 'Victoires',
		draws: 'N',
		drawsTitle: 'Nulles',
		losses: 'D',
		lossesTitle: 'Défaites',
		points: 'Pts'
	},
	game: {
		round: 'Manche {n}',
		game: 'Partie {n}',
		white: 'Blancs',
		black: 'Noirs',
		declared: 'Déclaré :',
		waitingFor: 'en attente de {name}',
		dispute: 'Contester',
		confirm: 'Confirmer',
		draw: 'Nulle',
		wins: '{name} gagne',
		whoWon: 'Qui a gagné ?',
		whoWonArmageddon: 'Qui a gagné ? Une nulle compte comme une victoire des Noirs.',
		autoIn: 'Validé automatiquement dans {n} h',
		autoSoon: 'Validé automatiquement dans moins d’une heure',
		autoConfirmed: 'validé automatiquement',
		notPlayed: 'non jouée'
	},
	week: {
		label: 'Semaine {n}',
		welcome: 'Bienvenue, {name}.',
		benched:
			'La phase de groupes de cette semaine est terminée : tu entres en jeu à la prochaine. En attendant, suis la finale.',
		joined: {
			one: 'Tu entres dans la semaine en cours : ta partie est dans « À toi de jouer ».',
			other: 'Tu entres dans la semaine en cours : tes {n} parties sont dans « À toi de jouer ».'
		},
		emptyThrone: 'Le trône est vide.',
		rules:
			'Chacun affronte chacun (3 parties par adversaire jusqu’à 4 joueurs, 2 jusqu’à 6, puis 1), puis une finale entre les deux meilleurs.',
		start: 'Lancer la semaine {n}',
		progress: { one: '{played} / {n} partie', other: '{played} / {n} parties' },
		perOpponent: '{n} par adversaire',
		king: 'Roi de la Semaine {n}',
		tie: 'Égalité.',
		playoff: '{names} se départagent en Armageddon (la nulle compte pour les Noirs).',
		forTheCrown: 'Pour la couronne',
		share: 'Partager',
		yourMove: 'À toi de jouer',
		knockout: 'Barrage et finale',
		shareKing: '♔ {name} est le Roi de la Semaine {n} ! Qui ose le détrôner ?',
		abandoned: 'Il ne reste pas assez de joueurs cette semaine : pas de roi. On remet ça la semaine prochaine.',
		deadline: 'Date limite : {when}',
		today: 'aujourd’hui',
		tomorrow: 'demain',
		inDays: 'dans {n} j'
	},
	nudge: {
		button: 'Relancer',
		head: '⏰ On relance ! {week} · {phase}',
		toPlay: 'À jouer :',
		toConfirm: 'À confirmer :',
		mustConfirm: '{name} doit confirmer {game}',
		nothing: 'Tout est joué, il ne reste qu’à confirmer.',
		before: '⏳ Avant {when}'
	},
	kings: {
		title: 'Les Rois',
		none: 'Aucun roi couronné pour l’instant.',
		crowns: { one: '{n} couronne', other: '{n} couronnes' },
		allTime: 'Classement général · phase de groupes',
		noGames: 'Pas encore de partie confirmée.',
		headToHead: 'Face à face · V-N-D, toutes phases',
		stats: 'Statistiques · toutes phases',
		games: { one: '{n} partie', other: '{n} parties' },
		winRate: 'Victoires',
		percent: '{n} %',
		bestStreak: 'Meilleure série',
		played: 'Parties',
		streakWin: { one: '{n} victoire', other: '{n} victoires de suite' },
		streakLoss: { one: '{n} défaite', other: '{n} défaites de suite' },
		streakDraw: { one: '{n} nulle', other: '{n} nulles de suite' },
		streakNow: 'En ce moment',
		nemesis: 'Bête noire',
		victim: 'Tête de Turc',
		nobody: 'personne'
	},
	login: {
		title: 'Connexion',
		heading: 'Qui joue ?',
		intro: 'Choisis ton nom et entre ton code.',
		noPlayers: 'Aucun joueur pour l’instant. Ajoute-les avec',
		code: 'Code',
		submit: 'Entrer',
		chooseName: 'Choisis ton nom.',
		wrongCode: 'Code incorrect.',
		locked: 'Trop d’essais. Réessaie dans {min} min.',
		bye: 'Compte supprimé. Merci pour les parties ♔'
	},
	code: {
		title: 'Mon code',
		choose: 'Choisis ton code',
		forcedIntro: 'Le code qu’on t’a donné est provisoire. Choisis le tien : personne d’autre ne le connaîtra.',
		intro: 'Change ton code quand tu veux. Tes autres appareils seront déconnectés.',
		done: 'Code changé. Tes autres appareils sont déconnectés.',
		temporary: 'Code provisoire',
		current: 'Code actuel',
		next: 'Nouveau code · 6 à 8 chiffres',
		again: 'Encore une fois',
		save: 'Enregistrer',
		notMe: 'Ce n’est pas moi · sortir',
		forgot: 'Code oublié ? Demande à l’admin un code provisoire.',
		wrongCurrent: 'Code actuel incorrect.',
		mismatch: 'Les deux nouveaux codes ne correspondent pas.',
		same: 'Choisis un code différent de l’actuel.'
	},
	pin: {
		length: 'Le code doit faire 6 à 8 chiffres.',
		repeated: 'Trop facile : un seul chiffre répété.',
		run: 'Trop facile : une suite de chiffres.'
	},
	invite: {
		title: 'Invitation',
		ogTitle: '♔ Tu es invité à Mate-Moi si tu peux',
		ogDescription: 'Le tournoi d’échecs de la semaine, entre amis. Choisis ton nom et ton code.',
		heading: 'Bienvenue à la cour',
		signedIn: 'Tu es déjà connecté. Cette invitation est pour un nouveau joueur : transmets-lui le lien.',
		back: 'Retour à la semaine',
		invalid: 'Cette invitation a expiré ou a déjà servi. Demande un nouveau lien à un admin.',
		intro:
			'Chacun affronte chacun, une finale, un Roi par semaine. Si la phase de groupes de la semaine est en cours, tu y entres tout de suite.',
		name: 'Ton nom (tel que les autres le verront)',
		pin: 'Ton code · 6 à 8 chiffres',
		again: 'Encore une fois',
		join: 'Rejoindre la ligue',
		alreadySignedIn: 'Tu es déjà connecté : cette invitation est pour un nouveau joueur.',
		mismatch: 'Les deux codes ne correspondent pas.',
		expired: 'Cette invitation a expiré ou a déjà servi.'
	},
	profile: {
		title: 'Mon profil',
		nameSaved: 'Nom changé.',
		sloganSaved: 'Devise enregistrée.',
		sloganRemoved: 'Devise retirée.',
		name: 'Mon nom',
		nameHint: 'Il change partout, même dans l’historique.',
		changeName: 'Changer mon nom',
		slogan: 'Ma devise',
		sloganPlaceholder: 'Je mate, donc je suis.',
		sloganHint: 'Affichée quand tu es couronné, et sur l’aperçu WhatsApp. Vide pour la retirer.',
		saveSlogan: 'Enregistrer ma devise',
		changeCode: 'Changer mon code',
		badName: 'Ton nom : 2 à 24 lettres (espaces, tirets et apostrophes permis).',
		nameTaken: 'Ce nom est déjà pris. Ajoute une initiale ?',
		sloganTooLong: 'Ta devise : {max} caractères maximum.',
		sloganLink: 'Pas de liens dans la devise.',
		deleteTitle: 'Supprimer mon compte',
		deleteIntro:
			'Ton nom, ton code et ta devise sont effacés pour de bon. Tes parties restent dans l’historique, au nom de « Joueur supprimé ».',
		deleteWeek:
			'Si tu joues la semaine en cours, tu en sors : en phase de groupes tes parties sont retirées, en barrage ou en finale tu perds les tiennes par forfait.',
		deleteCode: 'Ton code, pour confirmer',
		deleteConfirm: 'Supprimer définitivement',
		lastAdmin: 'Tu es le dernier admin. Nomme un autre admin d’abord.',
		owner: 'Tu es le propriétaire de la ligue : transfère d’abord la propriété à un autre admin (onglet Admin).'
	},
	admin: {
		title: 'Admin',
		inviteMessage:
			'♔ Tu es invité à rejoindre « Mate-Moi si tu peux », notre tournoi d’échecs de la semaine.\nChoisis ton nom et ton code ici (lien valable 48 h, une seule fois) :\n{link}',
		invitePlayer: 'Inviter un joueur',
		linkReady: 'Lien prêt. Il sert une seule fois, pendant 48 h :',
		copied: 'Copié ✓',
		copy: 'Copier',
		send: 'Envoyer',
		joinRule:
			'Pendant la phase de groupes, il entre dans la semaine en cours : ses parties contre chacun s’ajoutent. Après, il commence la semaine suivante.',
		createInvite: 'Créer un lien d’invitation',
		inviteBy: 'Lien de {by} · expire {when}',
		revoke: 'Annuler',
		players: 'Joueurs',
		tempPinFor: 'Code provisoire de {name} :',
		tempPinHint: 'Envoie-le-lui en privé : il choisira le sien à la connexion. Il ne sera plus affiché.',
		badgeAdmin: 'Admin',
		badgeArchived: 'Archivé',
		badgeTempPin: 'Code provisoire',
		badgeLocked: 'Bloqué',
		resetPin: 'Nouveau code provisoire',
		archive: 'Archiver',
		unarchive: 'Désarchiver',
		demote: 'Retirer admin',
		promote: 'Nommer admin',
		archiveHint:
			'Archiver : le joueur est déconnecté, disparaît de la connexion et sort de la semaine en cours ; son historique reste et on peut le désarchiver. Supprimer : son nom et son code sont effacés pour de bon, ses parties restent au nom de « Joueur supprimé ».',
		delete: 'Supprimer',
		deleteTitle: 'Supprimer {name} ?',
		deleteIntro:
			'Son nom, son code et sa devise sont effacés pour de bon ; ses parties restent, au nom de « Joueur supprimé ». Tape son nom pour confirmer.',
		deleteName: 'Son nom, exactement',
		deleteConfirm: 'Supprimer définitivement',
		deleteNameMismatch: 'Le nom ne correspond pas.',
		deleted: '{name} est supprimé.',
		backup: 'Sauvegarde',
		download: 'Télécharger toute la ligue (.db)',
		backupHint:
			'Un seul fichier : joueurs, parties, rois. À garder privé. Pour le restaurer ou changer de serveur, voir le README.',
		playerNotFound: 'Joueur introuvable.',
		notYourself: 'Pas sur ton propre compte.',
		badgeOwner: 'Propriétaire',
		ownerProtected: 'Le propriétaire de la ligue ne peut être ni retiré des admins, ni archivé, ni supprimé.',
		ownerOnly: 'Seul le propriétaire peut transférer la propriété.',
		transferToAdmin: 'La propriété se transfère seulement à un autre admin actif.',
		transfer: 'Transférer la propriété',
		transferTitle: 'Faire de {name} le propriétaire ?',
		transferIntro:
			'Tu restes admin, mais c’est {name} qui deviendra intouchable : ni retiré des admins, ni archivé, ni supprimé. Tape son nom pour confirmer.',
		transferConfirm: 'Transférer',
		transferred: '{name} est maintenant le propriétaire de la ligue.',
		week: 'Semaine en cours',
		deadline: 'Date limite de la phase de groupes',
		deadlineSave: 'Changer la date limite',
		deadlineHint:
			'À la date limite, les résultats en attente comptent tels que déclarés et les parties non jouées finissent 0 – 0 (perdues par les deux, zéro point). Puis barrage ou finale, sans date limite.',
		deadlineSaved: 'Nouvelle date limite : {when}.',
		wipeTitle: 'Réinitialiser la ligue',
		wipeRisk: 'À tes risques et périls',
		wipeIntro: 'Efface tous les autres joueurs, toutes les semaines, parties et couronnes, les invitations et les notifications. Il ne reste que ton compte, pour réinviter tout le monde à zéro.',
		wipeSafety: 'Juste avant, une copie complète est gardée sur le serveur. Télécharge quand même une sauvegarde ci-dessus.',
		wipeOpen: 'Je veux tout effacer',
		wipeWord: 'RÉINITIALISER',
		wipeTypeWord: 'Tape {word} pour confirmer',
		wipeCode: 'Ton code',
		wipeButton: 'Tout effacer',
		wipeWordMismatch: 'Tape exactement {word}.',
		wipeDone: 'Ligue remise à zéro. Copie de sécurité gardée sur le serveur : {file}.'
	},
	league: {
		weekNotOver: 'La semaine en cours n’est pas terminée.',
		needTwoPlayers: 'Il faut au moins deux joueurs.',
		gameNotFound: 'Partie introuvable.',
		weekOver: 'Cette semaine est terminée.',
		alreadyConfirmed: 'Ce résultat est déjà confirmé.',
		armageddonDraw: 'En Armageddon, la nulle compte comme une victoire des Noirs.',
		nothingToConfirm: 'Aucun résultat à confirmer.',
		opponentConfirms: 'C’est à ton adversaire de confirmer.',
		nothingToDispute: 'Aucun résultat à contester.',
		unknownResult: 'Résultat inconnu.',
		badDeadline: 'Date invalide.',
		deadlinePast: 'La date limite doit être dans le futur.',
		noOpenWeek: 'Aucune semaine en cours.',
		groupOver: 'La phase de groupes est terminée : plus de date limite.'
	},
	push: {
		title: 'Notifications',
		intro: 'Une notification quand on te déclare un résultat, quand tu joues la finale, et quand un roi est couronné.',
		on: 'Activer les notifications',
		off: 'Désactiver les notifications',
		enabled: 'Activées sur cet appareil.',
		ios: 'Sur iPhone : ajoute d’abord l’appli à l’écran d’accueil (Partager → Sur l’écran d’accueil).',
		unsupported: 'Ce navigateur ne sait pas recevoir de notifications.',
		denied: 'Notifications bloquées : autorise-les dans les réglages du navigateur.',
		failed: 'Impossible d’activer les notifications. Réessaie plus tard.',
		reportedTitle: 'Résultat à confirmer',
		reported: '{name} a déclaré : {result}. À toi de confirmer',
		finalTitle: 'Finale',
		final: 'Tu joues la finale contre {name}',
		armageddon: 'Finale nulle : Armageddon contre {name}',
		kingTitle: 'Nouveau roi',
		autoTitle: 'Résultat validé',
		auto: 'Validé automatiquement après 48 h : {game}, {result}'
	},
	preview: {
		kingTitle: '♔ {name} est le Roi de la Semaine {n}',
		tagline: 'Le tournoi d’échecs de la semaine.',
		open: 'Ouvrir Mate-Moi…',
		progress: { one: '{played}/{n} partie', other: '{played}/{n} parties' },
		record: '{w}V {d}N {l}D'
	}
};

export type Messages = typeof fr;

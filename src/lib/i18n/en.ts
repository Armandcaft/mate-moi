import type { Messages } from './fr.ts';

export const en = {
	app: {
		name: 'Mate-Moi si tu peux',
		short: 'Mate-Moi'
	},
	common: {
		pts: { one: '{n} pt', other: '{n} pts' },
		quote: '“{text}”',
		vs: 'vs',
		you: '(you)',
		pageNotFound: 'Page not found'
	},
	lang: {
		label: 'Langue / Language / Sprache'
	},
	theme: {
		label: 'Theme',
		auto: 'Auto',
		light: 'Light',
		dark: 'Dark'
	},
	nav: {
		week: 'This week',
		kings: 'The Kings',
		admin: 'Admin',
		profile: 'My profile',
		logoutTitle: 'Sign out',
		logout: 'sign out'
	},
	phase: {
		group: 'Group stage',
		playoff: 'Play-off',
		final: 'Final',
		done: 'Crowned'
	},
	stage: {
		group: 'Group',
		playoff: 'Play-off',
		final: 'Final'
	},
	table: {
		player: 'Player',
		played: 'P',
		playedTitle: 'Games played',
		wins: 'W',
		winsTitle: 'Wins',
		draws: 'D',
		drawsTitle: 'Draws',
		losses: 'L',
		lossesTitle: 'Losses',
		points: 'Pts'
	},
	game: {
		round: 'Round {n}',
		game: 'Game {n}',
		white: 'White',
		black: 'Black',
		declared: 'Reported:',
		waitingFor: 'waiting for {name}',
		dispute: 'Dispute',
		confirm: 'Confirm',
		draw: 'Draw',
		wins: '{name} wins',
		whoWon: 'Who won?',
		whoWonArmageddon: 'Who won? A draw counts as a win for Black.'
	},
	week: {
		label: 'Week {n}',
		welcome: 'Welcome, {name}.',
		benched: 'This week’s group stage is over: you’re in from next week. Until then, follow the final.',
		joined: {
			one: 'You’re in this week: your game is waiting under “Your move”.',
			other: 'You’re in this week: your {n} games are waiting under “Your move”.'
		},
		emptyThrone: 'The throne is empty.',
		rules:
			'Everyone plays everyone (3 games per opponent up to 4 players, 2 up to 6, then 1), then the top two play a final.',
		start: 'Start week {n}',
		progress: { one: '{played} / {n} game', other: '{played} / {n} games' },
		perOpponent: '{n} per opponent',
		king: 'King of the Week {n}',
		tie: 'Tie.',
		playoff: '{names} settle it in Armageddon (a draw counts for Black).',
		forTheCrown: 'For the crown',
		share: 'Share',
		shareWhatsapp: 'Share on WhatsApp',
		yourMove: 'Your move',
		knockout: 'Play-off and final',
		shareKing: '♔ {name} is King of the Week {n}! Who dares to dethrone them?'
	},
	kings: {
		title: 'The Kings',
		none: 'No king crowned yet.',
		crowns: { one: '{n} crown', other: '{n} crowns' },
		allTime: 'Overall standings · group stage',
		noGames: 'No confirmed games yet.',
		headToHead: 'Head to head · W-D-L, all stages'
	},
	login: {
		title: 'Sign in',
		heading: 'Who’s playing?',
		intro: 'Pick your name and enter your code.',
		noPlayers: 'No players yet. Add them with',
		code: 'Code',
		submit: 'Let me in',
		chooseName: 'Pick your name.',
		wrongCode: 'Wrong code.',
		locked: 'Too many tries. Try again in {min} min.'
	},
	code: {
		title: 'My code',
		choose: 'Choose your code',
		forcedIntro: 'The code you were given is temporary. Choose your own: nobody else will know it.',
		intro: 'Change your code whenever you like. Your other devices will be signed out.',
		done: 'Code changed. Your other devices are signed out.',
		temporary: 'Temporary code',
		current: 'Current code',
		next: 'New code · 6 to 8 digits',
		again: 'Once more',
		save: 'Save',
		notMe: 'That’s not me · sign out',
		forgot: 'Forgot your code? Ask the admin for a temporary one.',
		wrongCurrent: 'Your current code is wrong.',
		mismatch: 'The two new codes don’t match.',
		same: 'Pick a code that’s different from your current one.'
	},
	pin: {
		length: 'The code must be 6 to 8 digits.',
		repeated: 'Too easy: one digit repeated.',
		run: 'Too easy: a run of digits.'
	},
	invite: {
		title: 'Invitation',
		ogTitle: '♔ You’re invited to Mate-Moi si tu peux',
		ogDescription: 'The weekly chess tournament among friends. Pick your name and your code.',
		heading: 'Welcome to the court',
		signedIn: 'You’re already signed in. This invitation is for a new player: pass the link on.',
		back: 'Back to the week',
		invalid: 'This invitation has expired or has already been used. Ask an admin for a new link.',
		intro:
			'Everyone plays everyone, then a final: one King a week. If this week’s group stage is still on, you join it straight away.',
		name: 'Your name (as the others will see it)',
		pin: 'Your code · 6 to 8 digits',
		again: 'Once more',
		join: 'Join the league',
		alreadySignedIn: 'You’re already signed in: this invitation is for a new player.',
		mismatch: 'The two codes don’t match.',
		expired: 'This invitation has expired or has already been used.'
	},
	profile: {
		title: 'My profile',
		nameSaved: 'Name changed.',
		sloganSaved: 'Motto saved.',
		sloganRemoved: 'Motto removed.',
		name: 'My name',
		nameHint: 'It changes everywhere, history included.',
		changeName: 'Change my name',
		slogan: 'My motto',
		sloganPlaceholder: 'I mate, therefore I am.',
		sloganHint: 'Shown when you’re crowned, and in the WhatsApp preview. Leave it empty to remove it.',
		saveSlogan: 'Save my motto',
		changeCode: 'Change my code',
		badName: 'Your name: 2 to 24 letters (spaces, hyphens and apostrophes allowed).',
		nameTaken: 'That name’s taken. Add an initial?',
		sloganTooLong: 'Your motto: {max} characters max.',
		sloganLink: 'No links in your motto.'
	},
	admin: {
		title: 'Admin',
		inviteMessage:
			'♔ You’re invited to join “Mate-Moi si tu peux”, our weekly chess tournament.\nPick your name and your code here (link valid for 48 h, works once):\n{link}',
		invitePlayer: 'Invite a player',
		linkReady: 'Link ready. It works once, for 48 h:',
		copied: 'Copied ✓',
		copy: 'Copy',
		send: 'Send',
		joinRule:
			'During the group stage they join the current week: their games against everyone are added. After that, they start the following week.',
		createInvite: 'Create an invite link',
		inviteBy: 'Link from {by} · expires {when}',
		revoke: 'Cancel',
		players: 'Players',
		tempPinFor: 'Temporary code for {name}:',
		tempPinHint: 'Send it to them privately: they’ll choose their own when they sign in. It won’t be shown again.',
		badgeAdmin: 'Admin',
		badgeInactive: 'Inactive',
		badgeTempPin: 'Temporary code',
		badgeLocked: 'Locked',
		resetPin: 'New temporary code',
		deactivate: 'Deactivate',
		activate: 'Reactivate',
		demote: 'Remove admin',
		promote: 'Make admin',
		deactivateHint: 'A deactivated player is signed out, keeps their history and is left out of new weeks.',
		backup: 'Backup',
		download: 'Download the whole league (.db)',
		backupHint: 'One file: players, games, kings. Keep it private. To restore it or move servers, see the README.',
		playerNotFound: 'Player not found.',
		notYourself: 'Not on your own account.'
	},
	league: {
		weekNotOver: 'This week isn’t over yet.',
		needTwoPlayers: 'You need at least two players.',
		gameNotFound: 'Game not found.',
		weekOver: 'This week is over.',
		alreadyConfirmed: 'This result is already confirmed.',
		armageddonDraw: 'In Armageddon, a draw counts as a win for Black.',
		nothingToConfirm: 'No result to confirm.',
		opponentConfirms: 'It’s up to your opponent to confirm.',
		nothingToDispute: 'No result to dispute.',
		unknownResult: 'Unknown result.'
	},
	preview: {
		kingTitle: '♔ {name} is King of the Week {n}',
		tagline: 'The weekly chess tournament.',
		open: 'Open Mate-Moi…',
		progress: { one: '{played}/{n} game', other: '{played}/{n} games' },
		record: '{w}W {d}D {l}L'
	}
} satisfies Messages;

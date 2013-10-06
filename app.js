

App = Ember.Application.create({
	API_KEY: '75056d7bc703c8315dc94c31fc3d4d0a'
});


App.IndexRoute = Ember.Route.extend({

	model: function() {
		var today = new Date(),
			apiDate = today.getFullYear() + ("0" + (today.getMonth() + 1)).slice(-2) + "" + ("0" + today.getDate()).slice(-2),
			url = 'http://api.trakt.tv/calendar/premieres.json/' + App.get('API_KEY') + '/' + apiDate + '/30?callback=?';

		return Ember.$.getJSON(url);
	},

	setupController: function(controller, model) {
		var data = model.map(function(obj) {
			var date = obj.date;

			var episodes = obj.episodes.map(function(ep) {
				ep.date = date;
				return ep;
			});

			return episodes;
		});

		data = [].concat.apply([], data);


		var genres = data
			.map(function(obj) {
				return obj.show.genres;
			})
			.reduce(function(acc, genres) {
				genres.forEach(function(genre) {
					if (genre && acc.indexOf(genre) == -1) acc.push(genre);
				});

				return acc;
			}, []);


		controller.set('genres', genres.sort());
		controller.set('allEpisodes', data);
		controller.set('model', data);
	}
});


App.IndexController = Ember.ArrayController.extend({
	orderFields: [
		{
			label: 'Air Date',
			property: 'episode.first_aired'
		},
		{
			label: 'Rating',
			property: 'episode.ratings.percentage'
		}
	],
	orderDirections: ['Descending', 'Ascending'],
	filterQuery: '',
	filterGenre: 'All',


	init: function() {
		this._super();
		this.set('sortDirection', this.get('orderDirections')[1]);
	},


	filterChanged: function() {
		var filtered = this.get('allEpisodes').filter(function(obj) {
			return this.matchQuery(obj) && this.matchGenre(obj);
		}, this);

		this.set('model', filtered);
	}.observes('filterQuery', 'filterGenre'),


	orderChanged: function() {
		var property = this.get('ordering');
		this.set('sortProperties', [property]);
	}.observes('ordering'),


	sortDirectionChanged: function() {
		this.set('sortAscending', this.get('sortDirection') == 'Ascending');
	}.observes('sortDirection'),


	matchQuery: function(obj) {
		var query = this.get('filterQuery').toLowerCase();
		if (!query) return true;

		var title = (obj.show.title + ' ' + obj.episode.title).toLowerCase();
		return title.indexOf(query) > -1;
	},

	matchGenre: function(obj) {
		var genre = this.get('filterGenre');
		return genre ? obj.show.genres.indexOf(genre) > -1 : true;
	},


	actions: {
		genreClick: function(genre) {
			this.set('filterGenre', genre.toString());
		}
	}
});


App.EpisodeController = Ember.ObjectController.extend({
	isLoved: Ember.computed.gt('episode.ratings.percentage', 50)
});

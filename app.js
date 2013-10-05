

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


		controller.set('genres', ['All'].concat(genres));

		controller.set('allEpisodes', data);
		controller.set('content', data);
	}
});


App.IndexController = Ember.ArrayController.extend({
	orderFields: ['Air Date', 'Rating'],
	orderDirections: ['Descending', 'Ascending'],
	filterQuery: '',
	filterGenre: 'All',
	ordering: 'Air Date',

	sortDirection: 'Ascending',
	sortProperties: ['episode.first_aired'],


	filterChanged: function() {
		var episodes = this.get('allEpisodes'),
			self = this;

		var filtered = episodes.filter(function(obj) {
			return self.matchQuery(obj) && self.matchGenre(obj);
		});

		this.set('content', filtered);
	}.observes('filterQuery', 'filterGenre'),


	orderChanged: function() {
		var ordering = this.get('ordering');

		var prop = (function() {
			if (ordering == 'Air Date') return 'episode.first_aired';
			if (ordering == 'Rating') return 'episode.ratings.percentage';
		})();

		if (!prop) return;

		this.set('sortProperties', [prop]);
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
		if (genre == 'All') return true;

		return obj.show.genres.indexOf(genre) > -1;
	},


	actions: {
		genreClick: function(genre) {
			this.set('filterGenre', genre.toString());
		}
	}
});


App.EpisodeController = Ember.ObjectController.extend({
	isLoved: function() {
		return this.get('episode.ratings.percentage') > 50;
	}.property()
});
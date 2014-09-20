var http = require('http');

var sickbeard = function(){
    this.name = 'sickbeard';
    this.displayname = 'Sick Beard';
    this.description = 'Send commands to Sick Beard';

    this.defaultPrefs = [{
        name: 'hostname',
        type: 'text',
        value: 'localhost'
    },{
        name: 'port',
        type: 'text',
        value: '8081'
    },{
        name: 'api_key',
        type: 'text',
        value: '8f986691927886816287f06e96388dfe'
    }];
}

sickbeard.prototype.init = function(){
    var self = this;

    this.listen('sickbeard add (.+?)', 'standard', function(from, interface, params){
        self.findShow(params[0], interface, from)
    });
}

sickbeard.prototype.findShow = function(name, interface, from){
    var self = this;
    this.getPrefs().done(function(prefs){
        var options = {
            hostname: prefs.hostname,
            port: prefs.port,
            path: '/api/'+prefs.api_key+'/?cmd=sb.searchtvdb&name=' + encodeURIComponent(name) + '&lang=en',
            headers: {
                'user-agent': 'Woodhouse Bot - https://github.com/Woodhouse-bot/woodhouse'
            }
        };
        var data = "";

        var req = http.get(options, function(res) {
            res.on('data', function (response) {
                data += String(response);
            });

            res.on('end', function() {
                var obj = JSON.parse(data);
                var shows = obj.data.results;

                self.checkShow(shows, interface, from);
            });
        }).on('error', function(e) {
            console.log('problem with request: ' + e.message);
        });
    });
}

sickbeard.prototype.checkShow = function(shows, interface, from){
    var self = this;
    var show = shows.shift();
    var message = 'Did you mean: ' + show.name + ' (First Aired: ' + show.first_aired + ') - http://thetvdb.com/?tab=series&id=' + show.tvdbid;

    this.sendMessage(message, interface, from);
    this.api.addYesNoQuestion(
        message,
        function(){
            self.addShow(show, interface, from);
        },
        function(){
            self.checkShow(shows, interface, from)
        })
}

sickbeard.prototype.addShow = function(show, interface, from){
    var self = this;
    this.getPrefs().done(function(prefs){
        var options = {
            hostname: prefs.hostname,
            port: prefs.port,
            path: '/api/'+prefs.api_key+'/show.add/?identifier='+show.imdb+'&title='+encodeURIComponent(show.titles[0]),
            headers: {
                'user-agent': 'Woodhouse Bot - https://github.com/Woodhouse-bot/woodhouse'
            }
        };

        var req = http.get(options, function(res) {
            res.on('data', function (response) {
            });

            res.on('end', function() {
                self.sendMessage(show.titles[0] + ' added', interface, from);
            });
        }).on('error', function(e) {
            console.log('problem with request: ' + e.message);
        });
    });
}

module.exports = sickbeard;

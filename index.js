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
        value: ''
    }];
}

sickbeard.prototype.init = function(){
    var self = this;

    this.listen('sickbeard add (:<tv show>.+?)', 'standard', function(from, interface, params){
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

    if(shows.length > 0){
        var show = shows.shift();
        var message = 'Did you mean: ' + show.name + ' (First Aired: ' + show.first_aired + ') - http://thetvdb.com/?tab=series&id=' + show.tvdbid;

        this.sendMessage(message, interface, from);
        this.api.addYesNoQuestion(
            from,
            message,
            function(){
                self.addShow(show, interface, from);
            },
            function(){
                self.checkShow(shows, interface, from)
            }
        );
    } else {
        this.sendMessage('No more results', interface, from);
    }
}

sickbeard.prototype.addShow = function(show, interface, from){
    var self = this;
    this.getPrefs().done(function(prefs){
        var options = {
            hostname: prefs.hostname,
            port: prefs.port,
            path: '/api/'+prefs.api_key+'/?cmd=show.addnew&tvdbid='+show.tvdbid,
            headers: {
                'user-agent': 'Woodhouse Bot - https://github.com/Woodhouse-bot/woodhouse'
            }
        }, data = '';

        var req = http.get(options, function(res) {
            res.on('data', function (response) {
                data += response
            });

            res.on('end', function() {
                var obj = JSON.parse(data);

                if (obj.result === 'success') {
                    self.sendMessage(show.name + ' added', interface, from);
                } else {
                    self.sendMessage('There was an error adding the show. Message: ' + obj.message, interface, from);
                }
            });
        }).on('error', function(e) {
            console.log('problem with request: ' + e.message);
        });
    });
}

module.exports = sickbeard;

(function (win) {
    'use strict';

    var h5MiniAudioPlayer = function () {
        this.config = arguments[0] || {};
        this.mode = this.config.mode || 'loop';             //播放循环模式：loop-顺序循环播放；list-顺序播放，放完停止；single-单曲播放，放完停止；sLoop-单曲循环播放；random-列表随机播放
        this.volume = this.config.volume || 80;             //音量，0-100 （移动端无效）
        this.mute = this.config.mute || false;              //是否静音：true or false （移动端无效）     

        var _this = this,
            allowModes = ['loop', 'list', 'single', 'sLoop', 'random'],
            dataSource = [],
            stopEvent = null,
            count = 0,
            audio = null,
            createAudio = function () {
                audio = new Audio();
                audio.autoplay = false;
                audio.controls = false;
                audio.muted = _this.mute;
                audio.volume = _this.volume / 100;
                audio.pause();

                audio.addEventListener('ended', function () { shuffle(); }, false);
            },
            formatTime = function (t) {
                if (t > 0) {
                    var m = parseInt(t / 60, 10),
                        s = t % 60;
                    return (m <= 9 ? '0' + m : m) + ':' + (s <= 9 ? '0' + s : s);
                }
                return '00:00';
            },
            trim = function (source) {
                return (source || '').replace(/^(\s|\u00A0)+|(\s|\u00A0)+$/g, '');
            },
            addDataSource = function (res) {
                var source = trim(res);
                if (source != '' && dataSource.indexOf(source) < 0) {
                    dataSource.push(source);
                    count++;
                }

                _this.getCur() == '' && dataSource.length > 0 && (audio.src = dataSource[0]);
            },
            removeDataSource = function (res) {
                var source = trim(res);
                if (source != '') {
                    var idx = dataSource.indexOf(source);
                    if (idx >= 0) {
                        dataSource.splice(idx, 1);
                        count--;

                        if (_this.getCur().toLowerCase() == source.toLowerCase()) {
                            if (_this.mode == 'single' || _this.mode == 'sLoop') {
                                _this.stop();
                            } else {
                                shuffle();
                            }
                        }
                    }
                }
            },
            shuffle = function () {
                var t = arguments.length > 0 ? Number(arguments[0]) == 1 : true;
                if (dataSource.length > 0) {
                    count = dataSource.length;

                    if (_this.mode == 'sLoop') {
                        _this.setPosition(0);
                        _this.play();
                    }

                    if (_this.mode == 'list' || _this.mode == 'loop') {
                        var cur = _this.getCur(),
                            idx = dataSource.indexOf(cur),
                            nextId = t ? (idx + 1) : (idx - 1);

                        (_this.mode == 'loop' && nextId < 0) && (nextId = count - 1);
                        (_this.mode == 'loop' && nextId >= count) && (nextId = 0);
                        if (nextId >= 0 && nextId < count) {
                            _this.setCur(dataSource[nextId]);
                            _this.setPosition(0);
                            _this.play();
                        }
                    }

                    if (_this.mode == 'random') {
                        nextId = Math.floor(Math.random() * count);
                        _this.setCur(dataSource[nextId]);
                        _this.setPosition(0);
                        _this.play();
                    }
                } else {
                    _this.stop();
                }
            };

        //创建播放器
        createAudio();

        //添加播放资源
        this.add = function (res) {
            var source = res || '';
            if (typeof source === 'string') {
                addDataSource(res);
            } else {
                if (source instanceof Array) {
                    for (var i = 0, len = source.length; i < len; i++) {
                        addDataSource(source[i]);
                    }
                }
            }

            return this;
        };

        //删除播放资源
        this.remove = function (res) {
            var source = res || '';
            if (typeof source === 'string') {
                removeDataSource(res);
            } else {
                if (source instanceof Array) {
                    for (var i = 0, len = source.length; i < len; i++) {
                        removeDataSource(source[i]);
                    }
                }
            }

            return this;
        };

        //获取当前播放模式
        this.getMode = function () {
            return _this.mode;
        };

        //设置播放模式
        this.setMode = function (mode) {
            if (_this.mode != mode && allowModes.indexOf(mode) >= 0)
                _this.mode = mode;

            return this;
        };

        //设置播放进度
        this.setPosition = function (time) {
            try {
                audio.currentTime = (time || 0);
            } catch (ex) { }

            return this;
        };

        //获取播放进度
        this.getPosition = function () {
            var flag = arguments[0] || false;
            var currentTime = parseInt(~~audio.currentTime || 0, 10);
            return flag ? formatTime(currentTime) : currentTime;
        };

        //获取播放总时长
        this.getDuration = function () {
            var flag = arguments[0] || false;
            var duration = ~~audio.duration;
            if (duration == 0) {
                var bl = audio.buffered.length;
                if (bl > 0) duration = ~~audio.buffered.end(bl--);
            }
            duration = parseInt(duration == 0 ? audio.currentTime : duration, 10);
            return flag ? formatTime(duration) : duration;
        };

        //设置音量
        this.setVolume = function (volume) {
            volume = ~~volume;
            if (volume >= 0 && volume <= 100) {
                _this.volume = volume;
                audio.volume = volume / 100;
            }
            return this;
        };

        //获取是否静音
        this.getMute = function () {
            return audio.muted;
        };

        //设置静音
        this.setMute = function (mute) {
            if (audio.muted != mute) {
                _this.mute = mute;
                audio.muted = mute;
            }
            return this;
        };

        //获取当前播放的资源
        this.getCur = function () {
            return audio.currentSrc || '';
        };

        //设置当前播放资源
        this.setCur = function (res) {
            res = trim(res);
            if (res != '' && _this.getCur != res) {
                addDataSource(res);
                audio.src = res;
            }
            return this;
        };

        //播放
        this.play = function () {
            audio.play();
            return this;
        };

        //暂停
        this.pause = function () {
            !!!audio.paused && audio.pause();
            return this;
        };

        //停止
        this.stop = function () {
            _this.pause();
            stopEvent && stopEvent();
            return this;
        };

        //上一首
        this.prev = function () {
            _this.pause();
            shuffle(-1);
        };

        //下一首
        this.next = function () {
            _this.pause();
            shuffle(1);
        };

        //播放器事件
        this.on = function (eventName, eventFun) {
            if (['play', 'playing', 'pause', 'ended', 'timeupdate', 'progress'].indexOf(eventName) >= 0) {
                audio.addEventListener(eventName, function () {
                    eventFun && eventFun();
                }, false);
            } else if (eventName == 'error') {
                audio.addEventListener('error', function () {
                    var errCode = audio.error.code;
                    if (errCode == 2) {
                        eventFun && eventFun('抱歉，网络错误！');
                    } else if (errCode == 3) {
                        eventFun && eventFun('抱歉，媒体文件格式解码错误！');
                    } else if (errCode == 4) {
                        eventFun && eventFun('抱歉，不支持指定的媒体文件格式！');
                    } else {
                        eventFun && eventFun('抱歉，播放错误！');
                    }
                }, false);
            } else if (eventName == 'stop') {
                stopEvent = eventFun;
            }
            return this;
        };
    };

    win.h5MiniAudioPlayer = h5MiniAudioPlayer;
})(window);
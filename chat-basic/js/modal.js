/*========================================================
 * 弹出框
 * =======================================================*/
// TODO F7有些方法没实现,暂时不需要
;
(function ($, window, document, undefined) {
    var modaliosStack = [];
    var _modaliosTemplateTempDiv = document.createElement('div');

    function modalios(params) {
        params = params || {};
        var modaliosHTML = '';
        var buttonsHTML = '';
        if (params.buttons && params.buttons.length > 0) {
            for (var i = 0; i < params.buttons.length; i++) {
                buttonsHTML += '<span class="modalios-button' + (params.buttons[i].bold ? ' modalios-button-bold' : '') + '">' + params.buttons[i].text + '</span>';
            }
        }
        var titleHTML = params.title ? '<div class="modalios-title">' + params.title + '</div>' : '';
        var textHTML = params.text ? '<div class="modalios-text">' + params.text + '</div>' : '';
        var afterTextHTML = params.afterText ? params.afterText : '';
        var noButtons = !params.buttons || params.buttons.length === 0 ? 'modalios-no-buttons' : '';
        var verticalButtons = params.verticalButtons ? 'modalios-buttons-vertical' : '';
        modaliosHTML = '<div class="modalios ' + noButtons + ' ' + (params.cssClass || '') + '"><div class="modalios-inner">' + (titleHTML + textHTML + afterTextHTML) + '</div><div class="modalios-buttons ' + verticalButtons + '">' + buttonsHTML + '</div></div>';
        _modaliosTemplateTempDiv.innerHTML = modaliosHTML;
        var modalios = $(_modaliosTemplateTempDiv).children();
        $('body').append(modalios[0]);
        // Add events on buttons
        modalios.find('.modalios-button').each(function (index, el) {
            $(el).on('click', function (e) {
                if (params.buttons[index].close !== false) closemodalios(modalios);
                if (params.buttons[index].onClick) params.buttons[index].onClick(modalios, e);
                if (params.onClick) params.onClick(modalios, index);
            });
        });
        openmodalios(modalios);
        return modalios;
    }

    function openmodalios(modalios) {
        modalios = $(modalios);
        var ismodalios = modalios.hasClass('modalios');
        if ($('.modalios.modalios-in:not(.modalios-out)').length && ismodalios) {
            modaliosStack.push(function () {
                openmodalios(modalios);
            });
            return;
        }
        // do nothing if this modalios already shown
        if (true === modalios.data('f7-modalios-shown')) {
            return;
        }
        modalios.data('f7-modalios-shown', true);
        modalios.trigger('close', function () {
            modalios.removeData('f7-modalios-shown');
        });
        if (ismodalios) {
            modalios.show();
            modalios.css({
                marginTop: -Math.round(modalios.outerHeight() / 2) + 'px'
            });
        }
        if ($('.modalios-overlay').length === 0) {
            $('body').append('<div class="modalios-overlay"></div>');
        }
        var overlay = $('.modalios-overlay');
        //Make sure that styles are applied, trigger relayout;
        var clientLeft = modalios[0].clientLeft;//这个不能删,删了actions动画没了.
        // Trugger open event
        modalios.trigger('open');
        // Classes for transition in
        overlay.addClass('modalios-overlay-visible');
        modalios.removeClass('modalios-out').addClass('modalios-in').transitionEnd(function (e) {
            if (modalios.hasClass('modalios-out')) modalios.trigger('closed');
            else modalios.trigger('opened');
        });
        return true;
    }

    function closemodalios(modalios) {
        modalios = $(modalios || '.modalios-in');
        if (typeof modalios !== 'undefined' && modalios.length === 0) {
            return;
        }
        var ismodalios = modalios.hasClass('modalios');
        var overlay = $('.modalios-overlay');
        if (overlay && overlay.length > 0) {
            overlay.removeClass('modalios-overlay-visible');
        }
        modalios.trigger('close');
        modalios.removeClass('modalios-in').addClass('modalios-out').transitionEnd(function (e) {
            if (modalios.hasClass('modalios-out')) modalios.trigger('closed');
            else modalios.trigger('opened');
            modalios.remove();
        });
        if (ismodalios) {
            modaliosStackClearQueue();
        }
        return true;
    }

    function modaliosStackClearQueue() {
        if (modaliosStack.length) {
            (modaliosStack.shift())();
        }
    }

    var modaliosTitle = 'Tooltip';
    var modaliosButtonOk = 'Okey';
    var modaliosButtonCancel = 'Cancel';
    var modaliosPreloaderTitle = 'Loading';
    $.extend({
        prompt: function (value, title, callbackOk, callbackCancel) {
            if (arguments.length === 2) {
                callbackOk = arguments[1];
                title = arguments[0];
                value = '';
            }
            var m = modalios({
                text: '<input class="modalios-input" value="'+value+'"/>',
                title: typeof title === 'undefined' ? modaliosTitle : title,
                buttons: [
                    {text: modaliosButtonCancel, onClick: callbackCancel},
                    {text: modaliosButtonOk, bold: true, onClick: function(){
                        var value = $('.modalios-input').val();
                        callbackOk && callbackOk(value);
                    }}
                ]
            });
            m.on('opened', function(){
                var $input = $('.modalios-input');
                $input.focus();
                var input = $input.get(0);
                var value = $input.val();
                var valueLength = value ? value.length : 0;
                input.setSelectionRange && input.setSelectionRange(valueLength,valueLength);
            });
            return m;
        },
        alert: function (text, title, callbackOk) {
            if (typeof title === 'function') {
                callbackOk = arguments[1];
                title = undefined;
            }
            return modalios({
                text: text || '',
                title: typeof title === 'undefined' ? modaliosTitle : title,
                buttons: [
                    {text: modaliosButtonOk, bold: true, onClick: callbackOk}
                ]
            });
        },
        confirm: function (text, title, callbackOk, callbackCancel) {
            if (typeof title === 'function') {
                callbackCancel = arguments[2];
                callbackOk = arguments[1];
                title = undefined;
            }
            return modalios({
                text: text || '',
                title: typeof title === 'undefined' ? modaliosTitle : title,
                buttons: [
                    {text: modaliosButtonCancel, onClick: callbackCancel},
                    {text: modaliosButtonOk, bold: true, onClick: callbackOk}
                ]
            });
        },
        showPreloader: function (title) {
            return modalios({
                title: title || modaliosPreloaderTitle,
                text: '<div class="preloader"></div>',
                cssClass: 'modalios-preloader'
            });
        },
        hidePreloader: function () {
            closemodalios('.modalios.modalios-in');
        },
        showIndicator: function () {
            //$('body').append('<div class="preloader-indicator-overlay"></div><div class="preloader-indicator-modalios"><span class="preloader preloader-white"></span></div>');
            //去掉全屏透明遮盖层
            $('body').append('<div class="preloader-indicator-modalios"><span class="preloader preloader-white"></span></div>');
        },
        hideIndicator: function () {
            $('.preloader-indicator-overlay, .preloader-indicator-modalios').remove();
        },
        toast: function (text, during, closeCallBack) {

            if (typeof during === 'function') {
                closeCallBack = arguments[1];
                during = undefined;
            }

            if (!during) {
                during = 1500;
            }

            var m = modalios({
                title: '',
                text: text
            });
            if (closeCallBack) {
                m.on("close", closeCallBack);
            }
            setTimeout(function () {
                closemodalios();
            }, during);
            return modalios
        },
        actions: function (params) {
            var modalios, groupSelector, buttonSelector;
            params = params || [];
            if (params.length > 0 && !$.isArray(params[0])) {
                params = [params];
            }
            var modaliosHTML;
            var buttonsHTML = '';
            for (var i = 0; i < params.length; i++) {
                for (var j = 0; j < params[i].length; j++) {
                    if (j === 0) buttonsHTML += '<div class="actions-modalios-group">';
                    var button = params[i][j];
                    var buttonClass = button.label ? 'actions-modalios-label' : 'actions-modalios-button';
                    if (button.bold) buttonClass += ' actions-modalios-button-bold';
                    if (button.color) buttonClass += ' color-' + button.color;
                    if (button.bg) buttonClass += ' bg-' + button.bg;
                    if (button.disabled) buttonClass += ' disabled';
                    buttonsHTML += '<div class="' + buttonClass + '">' + button.text + '</div>';
                    if (j === params[i].length - 1) buttonsHTML += '</div>';
                }
            }
            modaliosHTML = '<div class="actions-modalios"><center>' + buttonsHTML + '</center></div>';
            _modaliosTemplateTempDiv.innerHTML = modaliosHTML;
            modalios = $(_modaliosTemplateTempDiv).children();
            $('body').append(modalios[0]);
            groupSelector = '.actions-modalios-group';
            buttonSelector = '.actions-modalios-button';
            var groups = modalios.find(groupSelector);
            groups.each(function (index, el) {
                var groupIndex = index;
                $(el).children().each(function (index, el) {
                    var buttonIndex = index;
                    var buttonParams = params[groupIndex][buttonIndex];
                    var clickTarget;
                    if ($(el).is(buttonSelector)) clickTarget = $(el);
                    if ($(el).find(buttonSelector).length > 0) clickTarget = $(el).find(buttonSelector);
                    if (clickTarget) {
                        clickTarget.on('click', function (e) {
                            if (buttonParams.close !== false) closemodalios(modalios);
                            if (buttonParams.onClick) buttonParams.onClick(modalios, e);
                        });
                    }
                });
            });
            openmodalios(modalios);
            return modalios;
        },
        closemodalios: closemodalios
    });
})(jQuery, window, document);


/*========================================================
 * 一些基础工具封装
 * =======================================================*/
$.extend({
    device: (function () {
        var device = {};
        var ua = navigator.userAgent;
        var android = ua.match(/(Android);?[\s\/]+([\d.]+)?/);
        var ipad = ua.match(/(iPad).*OS\s([\d_]+)/);
        var ipod = ua.match(/(iPod)(.*OS\s([\d_]+))?/);
        var iphone = !ipad && ua.match(/(iPhone\sOS)\s([\d_]+)/);

        device.ios = device.android = device.iphone = device.ipad = device.androidChrome = false;

        // Android
        if (android) {
            device.os = 'android';
            device.osVersion = android[2];
            device.android = true;
            device.androidChrome = ua.toLowerCase().indexOf('chrome') >= 0;
        }
        if (ipad || iphone || ipod) {
            device.os = 'ios';
            device.ios = true;
        }
        // iOS
        if (iphone && !ipod) {
            device.osVersion = iphone[2].replace(/_/g, '.');
            device.iphone = true;
        }
        if (ipad) {
            device.osVersion = ipad[2].replace(/_/g, '.');
            device.ipad = true;
        }
        if (ipod) {
            device.osVersion = ipod[3] ? ipod[3].replace(/_/g, '.') : null;
            device.iphone = true;
        }
        // iOS 8+ changed UA
        if (device.ios && device.osVersion && ua.indexOf('Version/') >= 0) {
            if (device.osVersion.split('.')[0] === '10') {
                device.osVersion = ua.toLowerCase().split('version/')[1].split(' ')[0];
            }
        }

        // Webview
        device.webView = (iphone || ipad || ipod) && ua.match(/.*AppleWebKit(?!.*Safari)/i);

        // Minimal UI
        if (device.os && device.os === 'ios') {
            var osVersionArr = device.osVersion.split('.');
            device.minimalUi = !device.webView &&
                (ipod || iphone) &&
                (osVersionArr[0] * 1 === 7 ? osVersionArr[1] * 1 >= 1 : osVersionArr[0] * 1 > 7) &&
                $('meta[name="viewport"]').length > 0 && $('meta[name="viewport"]').attr('content').indexOf('minimal-ui') >= 0;
        }

        // Check for status bar and fullscreen app mode
        var windowWidth = $(window).width();
        var windowHeight = $(window).height();
        device.statusBar = false;
        if (device.webView && (windowWidth * windowHeight === screen.width * screen.height)) {
            device.statusBar = true;
        } else {
            device.statusBar = false;
        }

        // Classes
        var classNames = [];

        // Pixel Ratio
        device.pixelRatio = window.devicePixelRatio || 1;
        classNames.push('pixel-ratio-' + Math.floor(device.pixelRatio));
        if (device.pixelRatio >= 2) {
            classNames.push('retina');
        }

        // OS classes
        if (device.os) {
            classNames.push(device.os, device.os + '-' + device.osVersion.split('.')[0], device.os + '-' + device.osVersion.replace(/\./g, '-'));
            if (device.os === 'ios') {
                var major = parseInt(device.osVersion.split('.')[0], 10);
                for (var i = major - 1; i >= 6; i--) {
                    classNames.push('ios-gt-' + i);
                }
            }

        }
        // Status bar classes
        if (device.statusBar) {
            classNames.push('with-statusbar-overlay');
        } else {
            $('html').removeClass('with-statusbar-overlay');
        }

        // Add html classes
        if (classNames.length > 0) $('html').addClass(classNames.join(' '));
        device.wx = ua.toLowerCase().indexOf('micromessenger') >= 0;
        // Export object
        return device;
    })()
});

$.extend({
    support: {
        touch: !!(('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch)
    }
});
$.extend({
    touchEvents: {
        start: $.support.touch ? 'touchstart' : 'mousedown',
        move: $.support.touch ? 'touchmove' : 'mousemove',
        end: $.support.touch ? 'touchend' : 'mouseup'
    }
});
$.extend({
    compareVersion: function (a, b) {
        if (a === b) return 0;
        var as = a.split('.');
        var bs = b.split('.');
        for (var i = 0; i < as.length; i++) {
            var x = parseInt(as[i]);
            if (!bs[i]) return 1;
            var y = parseInt(bs[i]);
            if (x < y) return -1;
            if (x > y) return 1;
        }
        return 1;
    }
});

$.fn.transform = function (transform) {
    for (var i = 0; i < this.length; i++) {
        var elStyle = this[i].style;
        elStyle.webkitTransform = elStyle.MsTransform = elStyle.msTransform = elStyle.MozTransform = elStyle.OTransform = elStyle.transform = transform;
    }
    return this;
};
$.fn.transition = function (duration) {
    if (typeof duration !== 'string') {
        duration = duration + 'ms';
    }
    for (var i = 0; i < this.length; i++) {
        var elStyle = this[i].style;
        elStyle.webkitTransitionDuration = elStyle.MsTransitionDuration = elStyle.msTransitionDuration = elStyle.MozTransitionDuration = elStyle.OTransitionDuration = elStyle.transitionDuration = duration;
    }
    return this;
};
$.fn.transitionEnd = function (callback) {
    var events = ['webkitTransitionEnd', 'transitionend', 'oTransitionEnd', 'MSTransitionEnd', 'msTransitionEnd'],
        i, j, dom = this;

    function fireCallBack(e) {
        /*jshint validthis:true */
        if (e.target !== this) return;
        callback.call(this, e);
        for (i = 0; i < events.length; i++) {
            dom.off(events[i], fireCallBack);
        }
    }

    if (callback) {
        for (i = 0; i < events.length; i++) {
            dom.on(events[i], fireCallBack);
        }
    }
    return this;
};
$.fn.animationEnd = function (callback) {
    var events = ['webkitAnimationEnd', 'OAnimationEnd', 'MSAnimationEnd', 'animationend'],
        i, j, dom = this;

    function fireCallBack(e) {
        callback(e);
        for (i = 0; i < events.length; i++) {
            dom.off(events[i], fireCallBack);
        }
    }

    if (callback) {
        for (i = 0; i < events.length; i++) {
            dom.on(events[i], fireCallBack);
        }
    }
    return this;
};

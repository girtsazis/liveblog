var Login = require('../app/scripts/bower_components/superdesk/client/spec/helpers/pages').login;
var waitForSuperdesk = require('../app/scripts/bower_components/superdesk/client/spec/helpers/utils').waitForSuperdesk;

var ptor = browser;

describe('login', function() {
    'use strict';

    var modal;

    beforeEach(function() {
        browser.driver.manage().window().setSize(1280, 1024);
        browser.get('/');
        modal = new Login();
    });

    it('form renders modal on load', function() {
        expect(modal.btn.isPresent()).toBe(true);
    });

    it('user can log in', function() {
        modal.login('admin', 'admin');
        expect(browser.getCurrentUrl()).toBe(ptor.baseUrl + '/#/liveblog');
        element(by.css('button.current-user')).click();
        expect(element(by.css('.user-info .displayname')).getText()).toBe('admin');
    });

    it('user can log out', function() {
        modal.login('admin', 'admin');
        waitForSuperdesk();
        element(by.css('button.current-user')).click();
        // wait for sidebar animation to finish
        browser.wait(function() {
            return element(by.buttonText('SIGN OUT')).isDisplayed();
        }, 200);
        element(by.buttonText('SIGN OUT')).click();
        browser.wait(function() {
            return browser.driver.isElementPresent(by.id('login-btn'));
        }, 5000);
    });

    it('unknown user can\'t log in', function() {
        modal.login('foo', 'bar');
        expect(modal.btn.isPresent()).toBe(true);
        expect(browser.getCurrentUrl()).not.toBe(ptor.baseUrl + '/#/liveblog');
        expect(modal.error.isPresent()).toBe(true);
    });

});

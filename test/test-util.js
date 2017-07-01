"use strict";

var chai         = require('chai');
var sinon        = require('sinon');
chai.use(require('sinon-chai'));
chai.use(require('chai-string'));

var backupProjectIds;

class TestUtil {
    // initial setup
    static commonBefore() {
        backupProjectIds = process.env.PROJECT_IDS;    
    }

    // teardown for each test
    static commonAfterEach() {
        if (!backupProjectIds) {
            // revert to undefined.
            delete process.env.PROJECT_IDS;
        } else {
            process.env.PROJECT_IDS = backupProjectIds;
        }
    }

    static createTestResponseForLinkUser() {
        return [
            {
                "id": 111, 
                "kind": "account_membership", 
                "person": {
                    "email": "yasu@tenka.com", 
                    "id": 111, 
                    "initials": "IT", 
                    "kind": "person", 
                    "name": "Ieyasu Tokugawa", 
                    "username": "tanuki"
                }
            }, 
            {
                "id": 222, 
                "kind": "account_membership", 
                "person": {
                    "email": "hide@tenka.com", 
                    "id": 222, 
                    "initials": "HT", 
                    "kind": "person", 
                    "name": "Hideyoshi Toyotomi", 
                    "username": "saru"
                }
            }, 
            {
                "id": 333, 
                "kind": "account_membership", 
                "person": {
                    "email": "nobu@tenks.com", 
                    "id": 333, 
                    "initials": "NO", 
                    "kind": "person", 
                    "name": "Nobunaga Oda", 
                    "username": "utsuke"
                }
            }
        ];
    }
}

module.exports = TestUtil;
/// <reference types="cypress" />
import { Server, WebSocket } from 'mock-socket';

import { initProtocol, sendMessage } from '../support/helpers/socket.helpers';
import { Message } from '../../src/proto';
import { createAssistantClient } from '../../src/index';

/* eslint-disable @typescript-eslint/camelcase */

describe('Проверяем createAssistantClient', () => {
    let server: undefined | Server;
    const SOCKET_URL = 'ws://test.com';
    const USER_CHANNEL = 'COMPANION_B2C';
    const SURFACE = 'COMPANION';
    const APPS = [
        {
            projectId: 'test-1-projectId',
            applicationId: 'test-1-applicationId',
            appversionId: 'test-1-appversionId',
            frontendType: 'EMBEDDED_APP',
        },
        {
            projectId: 'test-2-projectId',
            applicationId: 'test-2-applicationId',
            appversionId: 'test-2-appversionId',
            frontendType: 'WEB_APP',
        },
    ];

    const logs = [];

    const getState = () => Promise.resolve({});

    const initAssistant = () =>
        createAssistantClient({
            url: SOCKET_URL,
            userChannel: USER_CHANNEL,
            userId: 'webdbg_userid_6f141a9rg4tmt8mvun9x6',
            getToken: () => Promise.resolve('token'),
            legacyDevice: undefined,
            locale: 'ru',
            device: {
                surface: SURFACE,
                platformType: 'web',
                platformVersion: '1',
                surfaceVersion: '1',
                features: '',
                capabilities: '',
                deviceId: 'deviceid_rgbohdnn3jr78q03y9duq6',
                deviceManufacturer: '',
                deviceModel: '',
                additionalInfo: '',
            },
            settings: {
                authConnector: 'developer_portal_jwt',
                dubbing: 1,
                echo: -1,
                ttsEngine: '',
                asrEngine: '',
                asrAutoStop: -1,
            },
            version: 5,
        });

    const socketOnMessage = (subscriber: (message: Message) => void) => {
        server.on('connection', (socket) => {
            socket.binaryType = 'arraybuffer';
            initProtocol(socket);

            socket.on('message', (data) => {
                const message = Message.decode((data as Uint8Array).slice(4));

                subscriber(message);
            });
        });
    };

    beforeEach(() => {
        cy.stub(window, 'WebSocket').callsFake((url) => new WebSocket(url));
        server = new Server(SOCKET_URL);
    });

    afterEach(() => {
        if (server) {
            server.stop();
            server = undefined;
        }
    });

    // it('BackgroundApps: апп добавляется и удаляется', () => {
    //     socketOnMessage((message) => {
    //         logs.push(message);
    //     });

    //     const assistant = initAssistant();
    //     const appEmbedded = assistant.addBackgroundApp({ appInfo: APPS[0], getState });

    //     assistant.sendText('привет');
    // });

    it('BackgroundApps: апп добавляется и удаляется', () => {
        // const command = {
        //     sdk_meta: {
        //         mid: '1234',
        //         requestId: undefined,
        //     },
        //     type: 'smart_app_data',
        //     smart_app_data: { myData: 'hello' },
        // };

        server.on('connection', (socket) => {
            socket.binaryType = 'arraybuffer';

            sendMessage(socket, 1234, {
                systemMessageData: {
                    // eslint-disable-next-line @typescript-eslint/camelcase
                    auto_listening: false,
                    // eslint-disable-next-line @typescript-eslint/camelcase
                    app_info: APPS[0],
                    items: [
                        {
                            command: {
                                type: 'smart_app_data',
                                smart_app_data: { myData: 'hello' },
                            },
                        },
                    ],
                },
            });

            socket.on('message', (data) => {
                const message = Message.decode((data as Uint8Array).slice(4));

                console.log('message', message);
                // logs.push(message);
            });
        });

        const assistant = initAssistant();

        assistant.start({ disableGreetings: false, initPhrase: 'привет!' });

        const appEmbedded = assistant.addBackgroundApp({ appInfo: APPS[0], getState });
        appEmbedded.onCommand((com) => console.log('onCommand', com));
    });

    console.log('socketOn', logs);

    // it('BackgroundApps: systemMessages для аппа отправляются в апп', () => {});
    // it('BackgroundApps: подписчики на аппа добавляются и удаляются', () => {});
    // it('BackgroundApps: serverAction отправляется в апп', () => {});
});

./compile.sh;\
    browserify org/network/individual_pledge/PhoneClient.js -o ../resources/static/phone_client.js -s app;\
    browserify org/network/group_pledge_summary/AllPledgesPageCaller.js -o ../resources/static/group_pledge_summary.js -s app;\
    browserify org/network/group_pledge/GroupPledgeClient.js -o ../resources/static/group_pledge_client.js -s app

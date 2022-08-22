# Network Metrics Logger

*Log metrics on network I/O*

This fleet logs network I/O metrics on a configurable interval from data provided by [System Metrics](https://github.com/balena-io-examples/system-metrics) block. The logger generates minimal output to avoid creation of more network I/O itself.

## Getting Started

Simply click on the *Deploy with balena* button below to create a fleet from the [docker-compose](https://github.com/balena-io-examples/network-metrics-logger/blob/master/docker-compose.yml) file in this repository.

[![balena deploy button](https://www.balena.io/deploy.svg)](https://dashboard.balena-cloud.com/deploy?repoUrl=https://github.com/balena-io-examples/network-metrics-logger)

By default the fleet publishes bytes transmitted and received every five minutes on the first interface received from the System Metrics block. Output is formatted as CSV. You should see messages like below.

```
11.07.22 12:54:36 (+0000)  network-metrics-logger  Received initial loggable message for interface lo; starting publish interval
11.07.22 12:59:36 (+0000)  network-metrics-logger  elapsedRx,elapsedTx
11.07.22 12:59:36 (+0000)  network-metrics-logger  40976,40976
11.07.22 13:04:36 (+0000)  network-metrics-logger  42868,42868
```
Notice the first message includes the name of the interface, in this case the loopback interface `lo`. See METRICS_REQUEST configuration below to specify a different interface.

## Configuration
Environment variables you may configure are listed in the sections below.

### METRICS_REQUEST

The METRICS_REQUEST variable is [defined](https://github.com/balena-io-examples/system-metrics#metrics_request) by the System Metrics block to collect network I/O readings. The fleet collects metrics on **all** interfaces by default to help you get started, as you can see by the asterisk (*) in the first term of the request text below.

```
networkStats/(*), networkStats/iface, networkStats/rx_bytes, networkStats/tx_bytes
```

However, the network metrics logger service only reports data from the **first** interface it receives from System Metrics. Often this interface is `lo`, the loopback interface, which probably is not what you want.

So create/update a `METRICS_REQUEST` environment variable with the single interface of interest. For example, if you are interested in interface `eth0`, set METRICS_REQUEST like below.

```
networkStats/(eth0), networkStats/rx_bytes, networkStats/tx_bytes
```

If you don't know the name of the interface, use Network Manager to find it. In the example below, `eth0` is provided in the DEVICE column value for the wired Ethernet interface.

```
$ nmcli d
DEVICE           TYPE      STATE        CONNECTION
eth0             ethernet  connected    Wired connection 1
br-e9a3932238a8  bridge    connected    br-e9a3932238a8
docker0          bridge    connected    docker0
br-0147258db07c  bridge    connected    br-0147258db07c
br-8c8071c3a98b  bridge    connected    br-8c8071c3a98b
br-c70b93f11882  bridge    connected    br-c70b93f11882
br-c7cdab3a8866  bridge    connected    br-c7cdab3a8866
wlp0s20f3        wifi      unavailable  --
vethe6eb4c6      ethernet  unmanaged    --
lo               loopback  unmanaged    --
```

### READING_INTERVAL_SEC

The READING_INTERVAL_SEC variable is [defined](https://github.com/balena-io-examples/system-metrics#reading_interval_sec) by the System Metrics block as the interval between metrics readings, in seconds. The logger service receives these raw readings from MQTT, accumulates totals and logs them. The default interval for a fleet is 300 seconds or 5 minutes.

The logger service itself also provides a `PUBLISH_INTERVAL_SEC` variable to allow accumulating byte totals across readings from the metrics block before publishing them to the system log. Defaults to `0`, which publishes totals as readings are received.
# Network Metrics Logger

*Log metrics on network I/O*

This fleet logs network I/O metrics on a configurable interval. It generates minimal output to avoid creation of network I/O itself.

## Getting Started

Simply click on the *Deploy with balena* button below to create a fleet from the docker-compose file in this repository.

[![balena deploy button](https://www.balena.io/deploy.svg)](https://dashboard.balena-cloud.com/deploy?repoUrl=https://github.com/balena-io-examples/network-metrics-logger)

By default the fleet publishes bytes transmitted and received every five minutes on the first requested interface. You should see messages like below.

```
11.07.22 12:54:36 (+0000)  network-metrics-logger  Received initial loggable message for interface lo; starting publish interval
11.07.22 12:59:36 (+0000)  network-metrics-logger  elapsedRx: 40976, elapsedTx: 40976
11.07.22 13:04:36 (+0000)  network-metrics-logger  elapsedRx: 42868, elapsedTx: 42868
```
Notice the first message specifies the name of the interface, in this case 'lo'. See METRICS_REQUEST configuration below to specify a different interface.

## Configuration
Environment variables you may configure are listed in the sections below. Variables may be defined as balena **Fleet** variables or **Device** variables.

### METRICS_REQUEST

The METRICS_REQUEST variable is defined by the [system-metrics block](https://github.com/balena-io-examples/system-metrics) to collect the network I/O data. By default the fleet collects metrics on **all** interfaces to help you get started, as you can see in the request text below.

```
networkStats/(*), networkStats/iface, networkStats/rx_bytes, networkStats/tx_bytes
```

However, the network metrics logger container only reports data from the **first** interface in the list it receives. Often this interface is `lo`, the localhost interface, which probably is not what you want.

So create/update a `METRICS_REQUEST` device variable with the single interface of interest. For example, if you are interested in interface `eth0`, set METRICS_REQUEST like below.

```
networkStats/(eth0), networkStats/rx_bytes, networkStats/tx_bytes
```

If you don't know the name of the interface, use Network Manager to find it. In the example below, `eth0` is the DEVICE column value for the wired Ethernet interface.

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

### PUBLISH_INTERVAL_SEC

Interval between publishing metrics, in seconds. Defaults to `300` (5 minutes).

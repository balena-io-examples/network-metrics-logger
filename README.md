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

If you don't know the name of the interface, use the `ifconfig` command to find it. The example below includes an Ethernet interface, `eth0`, and a cellular interface, `wwp1s0u1u1i4`.

<details><summary>Click for ifconfig command example</summary>
<p>

```
root@abcdef0:~# ifconfig |grep -B 1 inet

balena0   Link encap:Ethernet  HWaddr 02:42:83:5E:26:AC  
          inet addr:10.114.101.1  Bcast:10.114.101.255  Mask:255.255.255.0
--
br-233ab2d0cdb1 Link encap:Ethernet  HWaddr 02:42:DE:0E:DC:2A  
          inet addr:172.17.0.1  Bcast:172.17.255.255  Mask:255.255.0.0
          inet6 addr: fe80::42:deff:fe0e:dc2a/64 Scope:Link
--
eth0      Link encap:Ethernet  HWaddr DC:A6:32:E8:C9:56  
          inet addr:192.168.1.127  Bcast:192.168.1.255  Mask:255.255.255.0
          inet6 addr: fe80::aa2f:7f31:b094:9181/64 Scope:Link
          inet6 addr: fd25:36da:e8ec::e1d/128 Scope:Global
          inet6 addr: fd25:36da:e8ec:0:99aa:a2bd:39d5:f53f/64 Scope:Global
--
lo        Link encap:Local Loopback  
          inet addr:127.0.0.1  Mask:255.0.0.0
          inet6 addr: ::1/128 Scope:Host
--
resin-dns Link encap:Ethernet  HWaddr 2E:ED:31:EB:05:35  
          inet addr:10.114.102.1  Bcast:0.0.0.0  Mask:255.255.255.0
--
resin-vpn Link encap:UNSPEC  HWaddr 00-00-00-00-00-00-00-00-00-00-00-00-00-00-00-00  
          inet addr:10.246.34.90  P-t-P:52.4.252.97  Mask:255.255.255.255
          inet6 addr: fe80::a238:945a:e93b:c106/64 Scope:Link
--
supervisor0 Link encap:Ethernet  HWaddr 02:42:58:E8:D0:F7  
          inet addr:10.114.104.1  Bcast:10.114.104.127  Mask:255.255.255.128
--
veth43d6399 Link encap:Ethernet  HWaddr AA:CC:21:F4:A0:E6  
          inet6 addr: fe80::a8cc:21ff:fef4:a0e6/64 Scope:Link
--
wwp1s0u1u1i4 Link encap:UNSPEC  HWaddr 00-00-00-00-00-00-00-00-00-00-00-00-00-00-00-00  
          inet addr:100.56.81.95  P-t-P:100.65.50.81  Mask:255.255.255.252
```

</p>
</details>

### READING_INTERVAL_SEC

The READING_INTERVAL_SEC variable is [defined](https://github.com/balena-io-examples/system-metrics#reading_interval_sec) by the System Metrics block as the interval between metrics readings, in seconds. The logger service receives these raw readings from MQTT, accumulates totals and logs them. The default interval for a fleet is 300 seconds or 5 minutes.

The logger service itself also provides a `PUBLISH_INTERVAL_SEC` variable to allow accumulating byte totals across readings from the metrics block before publishing them to the system log. Defaults to `0`, which publishes totals as readings are received.
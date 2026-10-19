# Architecture Sync: Kafka vs RabbitMQ Migration for Edge Telemetry

Date: 2026-10-19
Attendees: Sarah (Principal Architect), Alex (Tech Lead), Dave (Staff Infra Engineer)

## Context & Problem
We currently ingest 120,000 telemetry events per second across 14 geographical edge POPs.
The current broker setup suffers from high backpressure and inconsistent partition consumer rebalancing.

## Discussion Notes
- Dave: RabbitMQ's AMQP queue model has high memory overhead with 500k+ unacknowledged messages. We tested it under peak load and rabbitmq-server choked on memory pressure.
- Sarah: What about Apache Kafka or Redpanda?
- Alex: Kafka with partitioned logs handles the sequential disk writes easily. We can retain 7 days of raw audit log on tiered S3 storage.
- Dave: Agreed. We decided to adopt Kafka for the core telemetry pipeline. We are rejecting RabbitMQ due to persistent memory bottlenecks under backpressure.
- Sarah: Who owns the Terraform IaC setup for the MSK cluster?
- Alex: I will take that. I'll deploy the Terraform MSK module by Friday.
- Dave: A blocker risk: cross-AZ data transfer costs could spike if producers are not configured with rack awareness.
- Sarah: Action item for Dave: Benchmark cross-AZ network latency and publish rack-affinity configuration before next Tuesday. Priority P0.
- Alex: Should we enable SSL client cert mutual TLS or SASL/SCRAM?
- Sarah: Let's investigate SASL/SCRAM vs mTLS. Open question for the security team.

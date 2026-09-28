import { PrismaClient } from '@prisma/client';
import { computeSHA256, computeMerkleRoot, generateSignature } from '../src/lib/hash';

const prisma = new PrismaClient();

async function main() {
  console.log('\n🌱 Starting ULPF database seed...\n');

  // 1. Clear existing data (order matters for referential integrity)
  await prisma.hashChainEntry.deleteMany();
  await prisma.registryRule.deleteMany();
  await prisma.quarantineLog.deleteMany();
  console.log('  ✓ Cleared existing data');

  // 2. Create QuarantineLog entries matching frontend mock data
  const logsData = [
    {
      id: 'log-q-001',
      timestamp: new Date('2026-10-24T09:15:32Z'),
      source: '192.168.1.55',
      rawLog: 'Oct 24 09:15:32 bastion-01 sshd[14209]: Failed password for invalid user admin from 192.168.1.55 port 44820 ssh2',
      status: 'UNPROCESSED' as const,
      attempts: 0,
    },
    {
      id: 'log-q-002',
      timestamp: new Date('2026-10-24T09:18:04Z'),
      source: 'Cisco-ASA-GW01',
      rawLog: '%ASA-4-106023: Deny tcp src outside:203.0.113.84/51234 dst inside:10.0.4.12/80 by access-group "OUTSIDE_IN" [0x0, 0x0]',
      status: 'AI_RESOLVED' as const,
      attempts: 1,
      ocsfEvent: {
        class_uid: 4001,
        category_uid: 4,
        severity_id: 3,
        time: '2026-10-24T09:18:04Z',
        metadata: {
          uid: 'evt-ocsf-9921',
          original_format: 'ai_inferred',
          product_name: 'Cisco ASA Firewall',
          vendor_name: 'Cisco Systems',
        },
        src_endpoint: { ip: '203.0.113.84', port: 51234, zone: 'outside' },
        dst_endpoint: { ip: '10.0.4.12', port: 80, zone: 'inside' },
        action: 'Denied',
        unmapped: {
          access_group: 'OUTSIDE_IN',
          facility: 'ASA-4-106023',
        },
      },
    },
    {
      id: 'log-q-003',
      timestamp: new Date('2026-10-24T09:22:11Z'),
      source: 'Unknown',
      rawLog: 'CEF:0|CloudVendor|SecurityApp|2.4|EXPLOIT|Zero-Day Buffer Overflow Attempt|9|src=198.51.100.44 dst=172.16.0.88 spt=61002 dpt=443 act=blocked reason=signature_match',
      status: 'NEEDS_REVIEW' as const,
      attempts: 3,
      error: "Validation error: 'severity_id' must be an integer between 0 and 6 (AI model returned string 'HIGH')",
      ocsfEvent: {
        class_uid: 2001,
        category_uid: 2,
        severity_id: 5,
        time: '2026-10-24T09:22:11Z',
        metadata: {
          uid: 'evt-ocsf-4040',
          original_format: 'manual_authoring',
          product_name: 'SecurityApp',
        },
        unmapped: {
          raw_cef_version: 0,
          act: 'blocked',
          reason: 'signature_match',
        },
      },
    },
    {
      id: 'log-q-004',
      timestamp: new Date('2026-10-24T09:25:40Z'),
      source: '10.200.4.11',
      rawLog: '<133>1 2026-10-24T09:25:40.102Z win-dc01.corp.internal Microsoft-Windows-Security-Auditing 4625 - - [TargetUserName="sysadmin" Status="0xc000006d" SubStatus="0xc000006a" IpAddress="10.200.4.11"] An account failed to log on.',
      status: 'AI_RESOLVED' as const,
      attempts: 2,
      ocsfEvent: {
        class_uid: 3002,
        category_uid: 3,
        severity_id: 3,
        time: '2026-10-24T09:25:40Z',
        metadata: {
          uid: 'evt-ocsf-8812',
          original_format: 'ai_inferred',
          product_name: 'Microsoft Windows Security Auditing',
        },
        actor: { user: { name: 'sysadmin' } },
        src_endpoint: { ip: '10.200.4.11' },
        unmapped: {
          event_id: 4625,
          nt_status: '0xc000006d',
          sub_status: '0xc000006a',
        },
      },
    },
    {
      id: 'log-q-005',
      timestamp: new Date('2026-10-24T09:30:15Z'),
      source: 'Unknown',
      rawLog: '{"eventVersion":"1.08","userIdentity":{"type":"IAMUser","principalId":"AIDAJQAB2C4VEXAMPLE","arn":"arn:aws:iam::123456789012:user/Alice"},"eventTime":"2026-10-24T09:30:15Z","eventSource":"s3.amazonaws.com","eventName":"GetObject","awsRegion":"us-east-1","sourceIPAddress":"198.51.100.12","errorCode":"AccessDenied","errorMessage":"Access Denied"}',
      status: 'UNPROCESSED' as const,
      attempts: 0,
    },
    {
      id: 'log-q-006',
      timestamp: new Date('2026-10-24T09:34:00Z'),
      source: '172.18.0.5',
      rawLog: '[PROPRIETARY-PLC-V3] HEAD:0xFA4B TIMESTAMP:1761308040 SENSOR_ID:882 ALARM_STATE:CRITICAL_TEMP VAL:104.8C HASH:a8f9c1b',
      status: 'NEEDS_REVIEW' as const,
      attempts: 3,
      error: 'Schema validation error: unmapped binary telemetry header \'HEAD:0xFA4B\' failed JSON type enforcement.',
    },
    {
      id: 'log-q-007',
      timestamp: new Date('2026-10-24T09:40:00Z'),
      source: 'k8s-cluster-prod',
      rawLog: '{"kind":"Event","apiVersion":"v1","metadata":{"name":"payment-service-pod.17f4a2","namespace":"finance"},"reason":"OOMKilled","message":"Container payment-api in pod payment-service-pod-5f9c4 exceeded memory limit (2GiB)","type":"Warning"}',
      status: 'APPROVED' as const,
      attempts: 1,
      ocsfEvent: {
        class_uid: 1007,
        category_uid: 1,
        severity_id: 4,
        time: '2026-10-24T09:40:00Z',
        metadata: {
          uid: 'evt-ocsf-1102',
          original_format: 'deterministic_registry',
          product_name: 'Kubernetes Engine',
        },
        unmapped: {
          namespace: 'finance',
          pod: 'payment-service-pod-5f9c4',
          reason: 'OOMKilled',
        },
      },
    },
  ];

  const createdLogs = [];
  for (const logData of logsData) {
    const log = await prisma.quarantineLog.create({ data: logData });
    createdLogs.push(log);
  }
  console.log(`  ✓ Created ${createdLogs.length} quarantine log entries`);

  // 3. Create RegistryRule entries matching frontend mock data
  const rulesData = [
    {
      id: 'rule-001',
      ruleName: 'Linux SSHD Auth Parser',
      sourcePattern: 'sshd\\\\[\\\\d+\\\\]: (Failed|Accepted) password',
      ocsfClass: 'Authentication (3002)',
      classUid: 3002,
      createdFromAi: true,
      promotedAt: new Date('2026-10-20T14:22:00Z'),
      matchCount: 142080,
      avgLatencyMs: 0.18,
    },
    {
      id: 'rule-002',
      ruleName: 'Cisco ASA Firewall Deny Normalizer',
      sourcePattern: '%ASA-\\\\d-\\\\d+: (Deny|Permit) (tcp|udp|icmp)',
      ocsfClass: 'Network Activity (4001)',
      classUid: 4001,
      createdFromAi: false,
      promotedAt: new Date('2026-10-15T10:00:00Z'),
      matchCount: 8940200,
      avgLatencyMs: 0.12,
    },
    {
      id: 'rule-003',
      ruleName: 'AWS CloudTrail API Access Control',
      sourcePattern: '"eventSource":"[a-z0-9]+\\\\.amazonaws\\\\.com"',
      ocsfClass: 'API Activity (6001)',
      classUid: 6001,
      createdFromAi: true,
      promotedAt: new Date('2026-10-22T18:45:00Z'),
      matchCount: 531090,
      avgLatencyMs: 0.25,
    },
  ];

  for (const ruleData of rulesData) {
    await prisma.registryRule.create({ data: ruleData });
  }
  console.log(`  ✓ Created ${rulesData.length} registry rules`);

  // 4. Create HashChainEntry records — building a proper chain
  let prevHash = computeSHA256('genesis');

  for (const log of createdLogs) {
    const hashData = JSON.stringify({
      id: log.id,
      rawLog: log.rawLog,
      timestamp: log.timestamp.toISOString(),
    });

    const hashValue = computeSHA256(hashData);
    const signature = generateSignature(hashValue);

    await prisma.hashChainEntry.create({
      data: {
        eventId: log.id,
        hashValue,
        prevHash,
        merkleRoot: computeMerkleRoot([hashValue, prevHash]),
        signature,
        rawData: log.rawLog,
      },
    });

    // Update the log with its hash info
    await prisma.quarantineLog.update({
      where: { id: log.id },
      data: { hashValue, prevHash },
    });

    prevHash = hashValue;
  }

  // Back-fill nextHash pointers
  const allEntries = await prisma.hashChainEntry.findMany({
    orderBy: { timestamp: 'asc' },
  });

  for (let i = 0; i < allEntries.length - 1; i++) {
    await prisma.hashChainEntry.update({
      where: { id: allEntries[i].id },
      data: { nextHash: allEntries[i + 1].hashValue },
    });
  }

  console.log(`  ✓ Created ${allEntries.length} hash chain entries with linked chain`);

  console.log('\n✅ Seed completed successfully!\n');
  console.log('  Summary:');
  console.log(`    • ${createdLogs.length} quarantine logs`);
  console.log(`    • ${rulesData.length} registry rules`);
  console.log(`    • ${allEntries.length} hash chain entries\n`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

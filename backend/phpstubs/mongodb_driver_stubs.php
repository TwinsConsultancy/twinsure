<?php
// PHP stubs for MongoDB driver classes to help static analysis tools.
// These are only declared when the real extension classes are not present.
namespace MongoDB\Driver {
    if (!class_exists('MongoDB\\Driver\\Manager')) {
        class Manager {
            public function __construct(?string $uri = null) {}
            public function executeQuery(string $namespace, \MongoDB\Driver\Query $query): \MongoDB\Driver\Cursor {}
            public function executeBulkWrite(string $namespace, \MongoDB\Driver\BulkWrite $bulk): \MongoDB\Driver\WriteResult {}
            public function executeCommand(string $db, \MongoDB\Driver\Command $command): \MongoDB\Driver\Cursor {}
        }
    }
    if (!class_exists('MongoDB\\Driver\\Query')) {
        class Query {
            public function __construct(array $filter = [], array $options = []) {}
        }
    }
    if (!class_exists('MongoDB\\Driver\\BulkWrite')) {
        class BulkWrite {
            public function __construct() {}
            public function insert(array $doc): void {}
            public function update(array $filter, array $update, array $options = []): void {}
            public function delete(array $filter, array $options = []): void {}
        }
    }
    if (!class_exists('MongoDB\\Driver\\Command')) {
        class Command {
            public function __construct(array $cmd) {}
        }
    }

    if (!class_exists('MongoDB\\Driver\\Cursor')) {
        class Cursor implements \Iterator {
            public function rewind(): void {}
            public function current() {}
            public function key() {}
            public function next(): void {}
            public function valid(): bool { return false; }
        }
    }

    if (!class_exists('MongoDB\\Driver\\WriteResult')) {
        class WriteResult {}
    }
}

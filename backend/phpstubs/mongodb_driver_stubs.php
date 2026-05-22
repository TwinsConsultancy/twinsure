<?php
// PHP stubs for MongoDB driver classes to help static analysis tools.
// These are only declared when the real extension classes are not present.
namespace MongoDB\Driver {
    if (!class_exists('MongoDB\\Driver\\Manager')) {
        class Manager {
            public function __construct(string $uri = null) {}
            public function executeQuery(string $namespace, \MongoDB\Driver\Query $query) {}
            public function executeBulkWrite(string $namespace, \MongoDB\Driver\BulkWrite $bulk) {}
            public function executeCommand(string $db, \MongoDB\Driver\Command $command) {}
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
            public function insert(array $doc) {}
            public function update(array $filter, array $update, array $options = []) {}
            public function delete(array $filter, array $options = []) {}
        }
    }
    if (!class_exists('MongoDB\\Driver\\Command')) {
        class Command {
            public function __construct(array $cmd) {}
        }
    }
}

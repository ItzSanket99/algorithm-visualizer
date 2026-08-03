package com.visualizer.engine.compiler;

import java.nio.file.Path;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

/**
 * Represents the result of a Java compilation.
 */
public final class CompilationResult {

    private final boolean success;
    private final Path sourceFile;
    private final Path classOutputDirectory;
    private final List<String> diagnostics;

    public CompilationResult(
            boolean success,
            Path sourceFile,
            Path classOutputDirectory,
            List<String> diagnostics
    ) {
        this.success = success;
        this.sourceFile = sourceFile;
        this.classOutputDirectory = classOutputDirectory;
        this.diagnostics = List.copyOf(
                Objects.requireNonNullElse(
                        diagnostics,
                        Collections.emptyList()
                )
        );
    }

    public boolean isSuccess() {
        return success;
    }

    public Path getSourceFile() {
        return sourceFile;
    }

    public Path getClassOutputDirectory() {
        return classOutputDirectory;
    }

    public List<String> getDiagnostics() {
        return diagnostics;
    }

    @Override
    public String toString() {

        return "CompilationResult{" +
                "success=" + success +
                ", sourceFile=" + sourceFile +
                ", classOutputDirectory=" + classOutputDirectory +
                ", diagnostics=" + diagnostics +
                '}';
    }

}
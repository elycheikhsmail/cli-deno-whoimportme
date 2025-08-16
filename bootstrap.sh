#!/bin/bash

# whoimportme bootstrap script
# Provides easy ways to run and compile the CLI tool

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[STATUS]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if Deno is installed
check_deno() {
    if ! command_exists deno; then
        print_error "Deno is not installed. Please install Deno first: https://deno.com/"
        exit 1
    fi
    
    # Check Deno version
    local deno_version=$(deno --version | head -n1 | cut -d " " -f2)
    print_status "Deno version: $deno_version"
}

# Function to run the CLI tool
run_cli() {
    print_status "Running whoimportme CLI tool..."
    
    # Check if src/cli.ts exists
    if [ ! -f "src/cli.ts" ]; then
        print_error "src/cli.ts not found. Please run this script from the project root."
        exit 1
    fi
    
    # Run the CLI tool with Deno
    deno run --allow-read --allow-write src/cli.ts "$@"
}

# Function to compile to binary
compile_binary() {
    local output_name="whoimportme"
    
    print_status "Compiling whoimportme to binary..."
    
    # Check if src/cli.ts exists
    if [ ! -f "src/cli.ts" ]; then
        print_error "src/cli.ts not found. Please run this script from the project root."
        exit 1
    fi
    
    # Use custom output name if provided
    if [ -n "$1" ]; then
        output_name="$1"
    fi
    
    # Compile the tool
    deno compile --allow-read --allow-write --output "$output_name" src/cli.ts
    
    if [ $? -eq 0 ]; then
        print_success "Successfully compiled binary: ./$output_name"
    else
        print_error "Failed to compile binary"
        exit 1
    fi
}

# Function to show help
show_help() {
    echo "whoimportme Bootstrap Script"
    echo "============================"
    echo
    echo "Usage:"
    echo "  ./bootstrap.sh [COMMAND]"
    echo
    echo "Commands:"
    echo "  run [args...]     Run the CLI tool with specified arguments"
    echo "  compile [name]     Compile the tool to a binary (default name: whoimportme)"
    echo "  help              Show this help message"
    echo
    echo "Examples:"
    echo "  ./bootstrap.sh run --help"
    echo "  ./bootstrap.sh run src/components/Button.tsx ."
    echo "  ./bootstrap.sh compile"
    echo "  ./bootstrap.sh compile my-cli-tool"
    echo
    echo "For more information, see the README.md file."
}

# Main script logic
main() {
    # Check if we're running on Windows (where chmod might not work as expected)
    if [[ "$OSTYPE" == "msys"* || "$OSTYPE" == "cygwin"* ]]; then
        print_warning "You appear to be on Windows. Make sure to run this script in a bash environment."
    fi
    
    # Parse command line arguments
    case "$1" in
        run)
            check_deno
            shift
            run_cli "$@"
            ;;
        compile)
            check_deno
            shift
            compile_binary "$1"
            ;;
        help|"")
            show_help
            ;;
        *)
            print_error "Unknown command: $1"
            echo "See './bootstrap.sh help' for usage information."
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"

use strict;

my @exts;

sub uniq {
    my %seen;
    grep !$seen{$_}++, @_;
}

while (<>) {
    /\/\// and next;
    /^$/ and next;
    /^([a-z]+)$/ and push @exts, $1;
    /.+\.([a-z]+)$/ and push @exts, $1;
}

@exts = uniq (sort (@exts));

foreach (@exts) {
    print "$_\n";
}
